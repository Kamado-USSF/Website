import assert from 'node:assert/strict';
import test from 'node:test';
import {
  reviewApplication,
  reviewClaim,
  reviewLinkRequest,
  reviewPromotion,
  reviewReport
} from '../lib/review';
import type {
  AccountLinkRequest,
  FieldReport,
  FinancialClaim,
  PromotionRequest,
  RecruitmentApplication,
  USSFMember
} from '../src/data/ussfData';

function makeMember(overrides: Partial<USSFMember> = {}): USSFMember {
  return {
    id: 'member-1',
    cid: 'SF-301',
    name: 'GhostOperator',
    callsign: 'Specter',
    rank: 'Private First Class',
    rankLevel: 3,
    rankCategory: 'Regular Member',
    division: 'First Infantry Regiment',
    joinedDate: '2025-01-01',
    status: 'Active Duty',
    promotionPoints: 300,
    totalPayout: 500000,
    arrestCount: 10,
    patrolHours: 12,
    playtimeHours: 40,
    serviceRibbons: ['Service Ribbon'],
    isMember: true,
    isApplicant: false,
    ...overrides
  };
}

function makeClaim(overrides: Partial<FinancialClaim> = {}): FinancialClaim {
  return {
    id: 'claim-1',
    rewardTitle: 'High Value Target Arrest',
    rewardCategory: 'Combat & Tactical',
    amount: 150000,
    claimantName: 'GhostOperator',
    claimantCid: 'SF-301',
    date: '2026-03-01',
    status: 'Pending',
    proofUrl: 'https://imgur.com/evidence',
    ...overrides
  };
}

function makeLinkRequest(overrides: Partial<AccountLinkRequest> = {}): AccountLinkRequest {
  return {
    id: 'link-1',
    username: 'website-user',
    inGameName: 'Operator_One',
    inGameCid: 'SF-301',
    ingameRank: 'Private',
    f5ScreenshotUrl: 'https://proof.example/image.png',
    submissionDate: '2026-03-01T00:00:00.000Z',
    status: 'Pending',
    ...overrides
  };
}

test('claim approval disburses payout and points once; rejection changes review fields only', () => {
  const members = [makeMember()];
  const claims = [makeClaim()];

  const approved = reviewClaim(claims, members, 'claim-1', { status: 'Approved', reviewedBy: 'Kamado' });
  assert.equal(approved.ok, true);
  assert.equal(claims[0].status, 'Approved');
  assert.equal(claims[0].reviewedBy, 'Kamado');
  assert.ok(claims[0].reviewedAt);
  assert.equal(members[0].totalPayout, 650000);
  assert.equal(members[0].promotionPoints, 325);
  assert.equal(approved.ok && approved.membersChanged, true);

  // Re-reviewing an already-approved claim must not pay out twice
  const again = reviewClaim(claims, members, 'claim-1', { status: 'Approved', reviewedBy: 'Kamado' });
  assert.equal(again.ok && again.membersChanged, false);
  assert.equal(members[0].totalPayout, 650000);

  const rejectedMembers = [makeMember()];
  const rejectedClaims = [makeClaim({ id: 'claim-2' })];
  const rejected = reviewClaim(rejectedClaims, rejectedMembers, 'claim-2', {
    status: 'Rejected',
    reviewedBy: 'Kamado',
    rejectionReason: 'Proof screenshot missing clock.'
  });
  assert.equal(rejected.ok, true);
  assert.equal(rejectedClaims[0].status, 'Rejected');
  assert.equal(rejectedClaims[0].rejectionReason, 'Proof screenshot missing clock.');
  assert.equal(rejectedMembers[0].totalPayout, 500000);
  assert.equal(rejected.ok && rejected.membersChanged, false);
});

test('claim review fails closed for unknown ids and missing status', () => {
  const members: USSFMember[] = [];
  const claims: FinancialClaim[] = [];
  const missing = reviewClaim(claims, members, 'claim-x', { status: 'Approved' });
  assert.equal(missing.ok, false);
  assert.equal(missing.ok === false && missing.status, 404);

  const noStatus = reviewClaim([makeClaim()], members, 'claim-1', {});
  assert.equal(noStatus.ok, false);
  assert.equal(noStatus.ok === false && noStatus.status, 400);
});

test('field report approval credits host and participants; rejection credits nobody', () => {
  const host = makeMember({ id: 'host-1', cid: 'SF-400', name: 'PatrolLead', patrolHours: 12, promotionPoints: 300 });
  const participant = makeMember({ id: 'p-1', cid: 'SF-401', name: 'Wingman', patrolHours: 5, promotionPoints: 100 });
  const reports: FieldReport[] = [{
    id: 'report-1',
    title: 'Night Patrol',
    type: 'Patrol',
    hostName: 'PatrolLead',
    hostCid: 'SF-400',
    participants: ['Wingman'],
    durationHours: 3,
    date: '2026-03-02',
    status: 'Pending Verification',
    summary: 'Routine patrol'
  }];

  const approved = reviewReport(reports, [host, participant], 'report-1', { status: 'Approved' });
  assert.equal(approved.ok, true);
  assert.equal(host.patrolHours, 15);
  assert.equal(host.promotionPoints, 320);
  assert.equal(participant.patrolHours, 8);
  assert.equal(participant.promotionPoints, 110);

  // Already approved: no double crediting
  reviewReport(reports, [host, participant], 'report-1', { status: 'Approved' });
  assert.equal(host.patrolHours, 15);
  assert.equal(host.promotionPoints, 320);

  const rejectedMembers = [makeMember({ patrolHours: 12, promotionPoints: 300 })];
  const rejectedReports: FieldReport[] = [{ ...reports[0], id: 'report-2', status: 'Pending Verification' }];
  reviewReport(rejectedReports, rejectedMembers, 'report-2', { status: 'Pending Verification' });
  assert.equal(rejectedMembers[0].patrolHours, 12);
  assert.equal(rejectedMembers[0].promotionPoints, 300);
});

test('promotion approval applies rank, category, point cost and history; rejection leaves rank untouched', () => {
  const member = makeMember({ promotionPoints: 1200 });
  const promotions: PromotionRequest[] = [{
    id: 'promo-1',
    operatorName: 'GhostOperator',
    operatorCid: 'SF-301',
    currentRank: 'Private First Class',
    targetRank: 'Staff Sergeant',
    targetRankLevel: 6,
    pointsCost: 400,
    remainingPoints: 800,
    currentPoints: 1200,
    submissionDate: '2026-03-01',
    status: 'Pending'
  }];

  const approved = reviewPromotion(promotions, [member], 'promo-1', { approvingOfficer: 'Kamado', status: 'Approved' });
  assert.equal(approved.ok, true);
  assert.equal(promotions[0].status, 'Approved');
  assert.equal(promotions[0].reviewedBy, 'Kamado');
  assert.ok(promotions[0].reviewedAt);
  assert.equal(member.rank, 'Staff Sergeant');
  assert.equal(member.rankLevel, 6);
  assert.equal(member.rankCategory, 'Special Operator');
  assert.equal(member.promotionPoints, 800);
  assert.equal(member.promotionHistory?.length, 1);
  assert.equal(member.promotionHistory?.[0].approvingOfficer, 'Kamado');

  const rejectMember = makeMember({ promotionPoints: 1200 });
  const rejectPromotions: PromotionRequest[] = [{
    id: 'promo-2',
    operatorName: 'GhostOperator',
    operatorCid: 'SF-301',
    currentRank: 'Private First Class',
    targetRank: 'Staff Sergeant',
    targetRankLevel: 6,
    pointsCost: 400,
    remainingPoints: 800,
    currentPoints: 1200,
    submissionDate: '2026-03-01',
    status: 'Pending'
  }];
  const rejected = reviewPromotion(rejectPromotions, [rejectMember], 'promo-2', {
    status: 'Rejected',
    reviewedBy: 'Kamado',
    rejectionReason: 'More patrol hours required.'
  });
  assert.equal(rejected.ok, true);
  assert.equal(rejectPromotions[0].status, 'Rejected');
  assert.equal(rejectPromotions[0].rejectionReason, 'More patrol hours required.');
  assert.equal(rejectMember.rank, 'Private First Class');
  assert.equal(rejectMember.promotionPoints, 1200);
  assert.equal(rejectMember.promotionHistory, undefined);

  const missing = reviewPromotion([], [], 'promo-x', { status: 'Approved' });
  assert.equal(missing.ok, false);
  assert.equal(missing.ok === false && missing.status, 404);
});

test('application acceptance enlists a recruit; denial does not touch the roster', () => {
  const members: USSFMember[] = [];
  const applications: RecruitmentApplication[] = [{
    id: 'app-1',
    applicantName: 'NewApplicant',
    discordTag: 'applicant#0001',
    age: 21,
    playtimeHours: 300,
    lawExperience: 'None',
    rulesAccepted: true,
    date: '2026-03-01',
    status: 'Pending Review'
  }];

  const accepted = reviewApplication(applications, members, 'app-1', { status: 'Accepted', cid: 'SF-555' });
  assert.equal(accepted.ok, true);
  assert.equal(applications[0].status, 'Accepted');
  assert.equal(members.length, 1);
  assert.equal(members[0].name, 'NewApplicant');
  assert.equal(members[0].cid, 'SF-555');
  assert.equal(members[0].rank, 'Recruit');

  const deniedMembers: USSFMember[] = [];
  const deniedApplications: RecruitmentApplication[] = [{ ...applications[0], id: 'app-2', status: 'Pending Review' }];
  const denied = reviewApplication(deniedApplications, deniedMembers, 'app-2', {
    status: 'Denied',
    reviewedBy: 'Kamado',
    rejectionReason: 'Incomplete application.'
  });
  assert.equal(denied.ok, true);
  assert.equal(deniedApplications[0].status, 'Denied');
  assert.equal(deniedApplications[0].reviewerNotes, 'Incomplete application.');
  assert.equal(deniedMembers.length, 0);
});

test('account-link approval maps the in-game CID to the website account; rejection records review', () => {
  const rosterMember = makeMember({ cid: 'SF-301', accountName: undefined });
  delete rosterMember.accountName;
  const linkRequests = [makeLinkRequest()];

  const approved = reviewLinkRequest(linkRequests, [rosterMember], 'link-1', {
    status: 'Approved',
    reviewedBy: 'Kamado'
  });
  assert.equal(approved.ok, true);
  assert.equal(linkRequests[0].status, 'Approved');
  assert.equal(linkRequests[0].reviewedBy, 'Kamado');
  assert.equal(rosterMember.accountName, 'website-user');
  assert.equal(approved.ok && approved.membersChanged, true);

  const rejectedMember = makeMember({ cid: 'SF-999' });
  delete rejectedMember.accountName;
  const rejectedRequests = [makeLinkRequest({ id: 'link-2', inGameCid: 'SF-999' })];
  const rejected = reviewLinkRequest(rejectedRequests, [rejectedMember], 'link-2', {
    status: 'Rejected',
    reviewedBy: 'Kamado',
    rejectionReason: 'Proof screenshot does not match CID.'
  });
  assert.equal(rejected.ok, true);
  assert.equal(rejectedRequests[0].status, 'Rejected');
  assert.equal(rejectedRequests[0].adminNote, 'Proof screenshot does not match CID.');
  assert.equal(rejectedMember.accountName, undefined);
  assert.equal(rejected.ok && rejected.membersChanged, false);

  const missing = reviewLinkRequest([], [], 'link-x', { status: 'Approved' });
  assert.equal(missing.ok, false);
  assert.equal(missing.ok === false && missing.status, 404);

  const noStatus = reviewLinkRequest([makeLinkRequest()], [], 'link-1', { reviewedBy: 'Kamado' });
  assert.equal(noStatus.ok, false);
  assert.equal(noStatus.ok === false && noStatus.status, 400);
});
