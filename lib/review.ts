import { USSF_RANKS } from '../src/data/ussfData.js';
import type {
  AccountLinkRequest,
  FieldReport,
  FinancialClaim,
  PromotionRequest,
  RecruitmentApplication,
  USSFMember
} from '../src/data/ussfData.js';

/**
 * Shared review logic for administrator approve/reject actions.
 *
 * Used by both the local Express server (server.ts) and the Vercel serverless
 * handlers (api/[...path].ts) so a review behaves identically in development
 * and production: the reviewed record, its audit fields, and every roster side
 * effect (payouts, rank changes, account linking, recruit creation) are applied
 * here, and the caller persists the mutated collections.
 */

export type ReviewOutcome<T> =
  | { ok: true; record: T; membersChanged: boolean }
  | { ok: false; status: number; error: string };

function requireStatus(status: unknown): string | false {
  if (typeof status !== 'string' || !status.trim() || status.length > 60) return false;
  return status.trim();
}

export function reviewClaim(
  claims: FinancialClaim[],
  members: USSFMember[],
  id: string,
  patch: Record<string, unknown>
): ReviewOutcome<FinancialClaim> {
  const status = requireStatus(patch.status);
  if (!status) return { ok: false, status: 400, error: 'Claim review status is required.' };
  const index = claims.findIndex(claim => claim.id === id);
  if (index < 0) return { ok: false, status: 404, error: 'Claim not found' };

  const claim = claims[index];
  const previousStatus = claim.status;
  claim.status = status as FinancialClaim['status'];
  if (patch.note !== undefined) claim.note = String(patch.note ?? '');
  if (patch.reviewedBy) claim.reviewedBy = String(patch.reviewedBy);
  if (patch.rejectionReason !== undefined) claim.rejectionReason = String(patch.rejectionReason ?? '');
  claim.reviewedAt = new Date().toISOString();

  // Approving disburses the payout and grants 25 promotion points, once.
  let membersChanged = false;
  if (status === 'Approved' && previousStatus !== 'Approved') {
    const claimant = members.find(member =>
      member.name === claim.claimantName || member.cid === claim.claimantCid
    );
    if (claimant) {
      claimant.totalPayout = (claimant.totalPayout || 0) + claim.amount;
      claimant.promotionPoints = (claimant.promotionPoints || 0) + 25;
      membersChanged = true;
    }
  }

  return { ok: true, record: claim, membersChanged };
}

export function reviewReport(
  reports: FieldReport[],
  members: USSFMember[],
  id: string,
  patch: Record<string, unknown>
): ReviewOutcome<FieldReport> {
  const status = requireStatus(patch.status);
  if (!status) return { ok: false, status: 400, error: 'Field report review status is required.' };
  const index = reports.findIndex(report => report.id === id);
  if (index < 0) return { ok: false, status: 404, error: 'Report not found' };

  const report = reports[index];
  const previousStatus = report.status;
  report.status = status as FieldReport['status'];

  // Approving credits patrol hours and promotion points to host and participants, once.
  let membersChanged = false;
  if (status === 'Approved' && previousStatus !== 'Approved') {
    const duration = report.durationHours || 1;
    const host = members.find(member => member.name === report.hostName || member.cid === report.hostCid);
    if (host) {
      host.patrolHours = (host.patrolHours || 0) + duration;
      host.promotionPoints = (host.promotionPoints || 0) + 20;
      membersChanged = true;
    }
    for (const participantName of report.participants || []) {
      const participant = members.find(member => member.name === participantName.trim());
      if (participant) {
        participant.patrolHours = (participant.patrolHours || 0) + duration;
        participant.promotionPoints = (participant.promotionPoints || 0) + 10;
        membersChanged = true;
      }
    }
  }

  return { ok: true, record: report, membersChanged };
}

export function reviewPromotion(
  promotions: PromotionRequest[],
  members: USSFMember[],
  id: string,
  patch: Record<string, unknown>
): ReviewOutcome<PromotionRequest> {
  const status = requireStatus(patch.status);
  if (!status) return { ok: false, status: 400, error: 'Promotion review status is required.' };
  const index = promotions.findIndex(request => request.id === id);
  if (index < 0) return { ok: false, status: 404, error: 'Promotion request not found.' };

  const request = promotions[index];
  const previousStatus = request.status;
  const approvingOfficer = patch.approvingOfficer ? String(patch.approvingOfficer) : undefined;
  const feedback = patch.feedback !== undefined ? String(patch.feedback ?? '') : undefined;
  const rejectionReason = patch.rejectionReason !== undefined ? String(patch.rejectionReason ?? '') : undefined;

  request.status = status as PromotionRequest['status'];
  if (feedback !== undefined) request.notes = feedback;
  if (approvingOfficer) request.reviewedBy = approvingOfficer;
  if (rejectionReason !== undefined) request.rejectionReason = rejectionReason;
  request.reviewedAt = new Date().toISOString();

  // Approving applies the promotion: new rank, category, point cost and history entry.
  let membersChanged = false;
  if (status === 'Approved' && previousStatus !== 'Approved') {
    const member = members.find(candidate =>
      candidate.cid === request.operatorCid || candidate.name === request.operatorName
    );
    if (member) {
      member.rank = request.targetRank;
      member.rankLevel = request.targetRankLevel;
      const rankDefinition = USSF_RANKS.find(rank =>
        rank.name === request.targetRank || rank.level === request.targetRankLevel
      );
      if (rankDefinition?.category) {
        member.rankCategory = rankDefinition.category as USSFMember['rankCategory'];
      }
      if (member.promotionPoints >= request.pointsCost) {
        member.promotionPoints -= request.pointsCost;
      }
      member.promotionHistory = member.promotionHistory || [];
      member.promotionHistory.unshift({
        id: `hist-${Date.now()}`,
        rankTitle: request.targetRank,
        rankLevel: request.targetRankLevel,
        timestamp: new Date().toISOString().split('T')[0],
        pointsUsed: request.pointsCost,
        approvingOfficer: approvingOfficer || 'High Command Council',
        citation: feedback || 'Promoted via verified command review.'
      });
      membersChanged = true;
    }
  }

  return { ok: true, record: request, membersChanged };
}

export function reviewApplication(
  applications: RecruitmentApplication[],
  members: USSFMember[],
  id: string,
  patch: Record<string, unknown>
): ReviewOutcome<RecruitmentApplication> {
  const status = requireStatus(patch.status);
  if (!status) return { ok: false, status: 400, error: 'Application review status is required.' };
  const index = applications.findIndex(application => application.id === id);
  if (index < 0) return { ok: false, status: 404, error: 'Application not found' };

  const application = applications[index];
  const reviewedBy = patch.reviewedBy ? String(patch.reviewedBy) : undefined;
  const rejectionReason = patch.rejectionReason ? String(patch.rejectionReason) : undefined;
  const requestedCid = patch.cid ? String(patch.cid).trim() : '';

  application.status = status as RecruitmentApplication['status'];
  if (rejectionReason || reviewedBy) {
    application.reviewerNotes = rejectionReason || `Reviewed by ${reviewedBy}`;
  }

  // Accepting enlists the applicant into the roster as a Recruit, once.
  // If the applicant already exists on the roster (name/account/CID match), the
  // existing record is upgraded instead of creating a duplicate entry.
  let membersChanged = false;
  if (status === 'Accepted' || status === 'Approved') {
    const websiteAccount = String(application.accountName || application.applicantName || '').trim();
    const normalizedName = application.applicantName.trim().toLowerCase();
    const normalizedAccount = websiteAccount.toLowerCase();
    const normalizedCid = requestedCid.toLowerCase();
    const existing = members.find(candidate =>
      (normalizedCid && (candidate.cid || '').trim().toLowerCase() === normalizedCid)
    ) || members.find(candidate =>
      (candidate.accountName || '').trim().toLowerCase() === normalizedAccount ||
      (candidate.name || '').trim().toLowerCase() === normalizedName
    );
    if (existing) {
      if (websiteAccount && existing.accountName !== websiteAccount) {
        existing.accountName = websiteAccount;
        membersChanged = true;
      }
      if (!existing.isMember || existing.isApplicant || existing.status === 'Applicant') {
        existing.isMember = true;
        existing.isApplicant = false;
        existing.status = 'Active Duty';
        membersChanged = true;
      }
      if (requestedCid && existing.cid !== requestedCid) {
        existing.cid = requestedCid;
        membersChanged = true;
      }
    } else {
    const newMember: USSFMember = {
      id: `member-${Date.now()}`,
      cid: requestedCid || `SF-${Math.floor(100 + Math.random() * 899)}`,
      name: application.applicantName,
      accountName: websiteAccount || application.applicantName,
      callsign: `Operator-${application.applicantName.substring(0, 4)}`,
      rank: 'Recruit',
      rankLevel: 1,
      rankCategory: 'Regular Member',
      division: 'First Infantry Regiment',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active Duty',
      presenceStatus: 'Online',
      promotionPoints: 0,
      totalPayout: 0,
      arrestCount: 0,
      patrolHours: 0,
      playtimeHours: application.playtimeHours || 0,
      country: 'International',
      age: application.age,
      serviceRibbons: ['Enlistment Ribbon'],
      avatarUrl: '/src/assets/images/military_leader_training_1790341999734.jpg',
      avatarFrame: 'Standard Issue Border',
      namecard: 'CIT2 Law Enforcer',
      isMember: true,
      isApplicant: false
    };
    members.unshift(newMember);
    membersChanged = true;
    }
  }

  return { ok: true, record: application, membersChanged };
}

export function reviewLinkRequest(
  linkRequests: AccountLinkRequest[],
  members: USSFMember[],
  id: string,
  patch: Record<string, unknown>
): ReviewOutcome<AccountLinkRequest> {
  const status = requireStatus(patch.status);
  if (!status) return { ok: false, status: 400, error: 'Account-link review status is required.' };
  const index = linkRequests.findIndex(request => request.id === id);
  if (index < 0) return { ok: false, status: 404, error: 'Link request not found' };

  const request = linkRequests[index];
  const reviewedBy = patch.reviewedBy ? String(patch.reviewedBy) : undefined;
  const rejectionReason = patch.rejectionReason ? String(patch.rejectionReason) : undefined;

  request.status = status as AccountLinkRequest['status'];
  if (reviewedBy) request.reviewedBy = reviewedBy;
  if (rejectionReason) request.adminNote = rejectionReason;

  // Approving maps the verified in-game identity to the website account on the
  // roster. When no roster record exists yet (a member who joined in-game before
  // the roster existed, or whose CID changed), the verified identity is enrolled
  // as a full active member so they receive every website feature. Matching also
  // falls back to account name / in-game name so a re-linked member is upgraded
  // instead of duplicated.
  let membersChanged = false;
  if (status === 'Approved') {
    const normalizedCid = request.inGameCid.trim().toLowerCase();
    const normalizedUsername = request.username.trim().toLowerCase();
    const normalizedName = request.inGameName.trim().toLowerCase();
    const member =
      members.find(candidate => (candidate.cid || '').trim().toLowerCase() === normalizedCid) ||
      members.find(candidate => (candidate.accountName || '').trim().toLowerCase() === normalizedUsername) ||
      members.find(candidate => (candidate.name || '').trim().toLowerCase() === normalizedName);

    if (member) {
      if (member.accountName !== request.username) {
        member.accountName = request.username;
        membersChanged = true;
      }
      if (!member.isMember || member.isApplicant || member.status === 'Applicant') {
        member.isMember = true;
        member.isApplicant = false;
        member.status = 'Active Duty';
        membersChanged = true;
      }
      if (!member.linkedInGame) {
        member.linkedInGame = true;
        membersChanged = true;
      }
      if ((!member.cid || member.cid === 'CIV-UNASSIGNED') && request.inGameCid) {
        member.cid = request.inGameCid;
        membersChanged = true;
      }
    } else {
      const rankDefinition =
        USSF_RANKS.find(rank => rank.name.trim().toLowerCase() === request.ingameRank.trim().toLowerCase()) ||
        USSF_RANKS.find(rank => rank.name.trim().toLowerCase().startsWith(request.ingameRank.trim().toLowerCase()));
      const newMember: USSFMember = {
        id: `member-${Date.now()}`,
        cid: request.inGameCid,
        name: request.inGameName,
        accountName: request.username,
        callsign: request.inGameName,
        rank: rankDefinition?.name || 'Recruit',
        rankLevel: rankDefinition?.level || 1,
        rankCategory: (rankDefinition?.category as USSFMember['rankCategory']) || 'Regular Member',
        division: 'Unassigned',
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'Active Duty',
        presenceStatus: 'Online',
        promotionPoints: 0,
        totalPayout: 0,
        arrestCount: 0,
        patrolHours: 0,
        playtimeHours: 0,
        serviceRibbons: ['Enlistment Ribbon'],
        avatarUrl: '/src/assets/images/military_leader_training_1790341999734.jpg',
        avatarFrame: rankDefinition?.unlockedFrame || 'Standard Issue Border',
        namecard: rankDefinition?.unlockedNamecard || 'CIT2 Law Enforcer',
        isMember: true,
        isApplicant: false,
        linkedInGame: true
      };
      members.unshift(newMember);
      membersChanged = true;
    }
  }

  return { ok: true, record: request, membersChanged };
}
