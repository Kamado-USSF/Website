import type { AccountLinkRequest, RecruitmentApplication, USSFAssetItem } from '../src/data/ussfData';

type GroupInfo = typeof import('../src/data/ussfData').USSF_GROUP_INFO & {
  customRanks?: import('../src/data/ussfData').RankDefinition[];
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateGroupInfo(input: unknown): ValidationResult<Partial<GroupInfo>> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Group specification updates must be a JSON object.' };
  }
  const body = input as Record<string, unknown>;
  const editableFields = [
    'name', 'level', 'founder', 'coFounder', 'commander', 'leaders', 'motto',
    'activeSince', 'tagUsage', 'commandCenters', 'skinsAvailable', 'carShadersAvailable',
    'customRanks'
  ] as const;
  const updates: Record<string, unknown> = {};
  for (const field of editableFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];
    if (field === 'customRanks') {
      if (!Array.isArray(value) || value.length < 1 || value.length > 40) {
        return { ok: false, error: 'customRanks must be an array of 1 to 40 rank definitions.' };
      }
      const ranks: Array<Record<string, unknown>> = [];
      for (const raw of value) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          return { ok: false, error: 'Each custom rank must be a JSON object.' };
        }
        const rank = raw as Record<string, unknown>;
        const name = String(rank.name ?? '').trim();
        const level = Number(rank.level);
        const order = Number(rank.order);
        const requiredDays = Number(rank.requiredDays);
        const requiredPoints = Number(rank.requiredPoints);
        const badgeColor = String(rank.badgeColor ?? '').trim();
        const unlockedFrame = String(rank.unlockedFrame ?? '').trim();
        const unlockedNamecard = String(rank.unlockedNamecard ?? '').trim();
        if (!name || name.length > 120 || !Number.isInteger(level) || level < 1 || level > 99 ||
            !Number.isFinite(order) || !Number.isFinite(requiredDays) || requiredDays < 0 ||
            !Number.isFinite(requiredPoints) || requiredPoints < 0 ||
            !badgeColor || badgeColor.length > 40 ||
            !unlockedFrame || unlockedFrame.length > 120 ||
            !unlockedNamecard || unlockedNamecard.length > 120) {
          return { ok: false, error: 'One or more custom rank definitions are invalid.' };
        }
        const sanitized: Record<string, unknown> = {
          level, name, order, requiredDays, requiredPoints, badgeColor, unlockedFrame, unlockedNamecard
        };
        if (typeof rank.category === 'string' && rank.category.trim()) {
          sanitized.category = rank.category.trim().slice(0, 60);
        }
        if (typeof rank.description === 'string' && rank.description.trim()) {
          sanitized.description = rank.description.trim().slice(0, 600);
        }
        ranks.push(sanitized);
      }
      updates.customRanks = ranks;
    } else if (field === 'skinsAvailable' || field === 'carShadersAvailable') {
      if (!Array.isArray(value) || value.length > 100 || value.some(item => typeof item !== 'string' || item.length > 120)) {
        return { ok: false, error: `${field} must be an array of strings.` };
      }
      updates[field] = value.map(item => (item as string).trim()).filter(Boolean);
    } else {
      if (typeof value !== 'string' || value.length > 2000) {
        return { ok: false, error: `${field} must be a string no longer than 2000 characters.` };
      }
      updates[field] = value.trim();
    }
  }
  if (Object.keys(updates).length === 0) {
    return { ok: false, error: 'No editable group specification fields were provided.' };
  }
  return { ok: true, value: updates as Partial<GroupInfo> };
}

export function validateLinkRequest(input: unknown): ValidationResult<Omit<AccountLinkRequest, 'id' | 'submissionDate' | 'status'>> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Account-link request must be a JSON object.' };
  }

  const request = input as Partial<AccountLinkRequest>;
  const username = String(request.username || '').trim();
  const inGameName = String(request.inGameName || '').trim();
  const inGameCid = String(request.inGameCid || '').trim();
  const ingameRank = String(request.ingameRank || '').trim();
  const f5ScreenshotUrl = String(request.f5ScreenshotUrl || '').trim();

  if (!username || !inGameName || !inGameCid || !ingameRank || !f5ScreenshotUrl) {
    return { ok: false, error: 'Website username, in-game name, CID, rank, and proof URL are required.' };
  }
  if (username.length > 100 || inGameName.length > 100 || inGameCid.length > 80 || ingameRank.length > 100 || f5ScreenshotUrl.length > 2048) {
    return { ok: false, error: 'One or more account-link fields exceed the allowed length.' };
  }

  let proofUrl: URL;
  try {
    proofUrl = new URL(f5ScreenshotUrl);
  } catch {
    return { ok: false, error: 'Proof must be a valid HTTP or HTTPS URL.' };
  }
  if (proofUrl.protocol !== 'http:' && proofUrl.protocol !== 'https:') {
    return { ok: false, error: 'Proof must be a valid HTTP or HTTPS URL.' };
  }

  return { ok: true, value: { username, inGameName, inGameCid, ingameRank, f5ScreenshotUrl } };
}

export function findLinkRequestConflict(
  state: { linkRequests?: AccountLinkRequest[]; members?: Array<{ cid?: string; accountName?: string }> },
  username: string,
  inGameCid: string
): { error: string; existing?: AccountLinkRequest } | null {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedCid = inGameCid.trim().toLowerCase();
  const requests = state.linkRequests || [];
  const pendingAccount = requests.find(request =>
    request.status === 'Pending' && request.username.trim().toLowerCase() === normalizedUsername
  );
  if (pendingAccount) {
    return pendingAccount.inGameCid.trim().toLowerCase() === normalizedCid
      ? { error: '', existing: pendingAccount }
      : { error: 'This website account already has a pending account-link request.' };
  }

  const pendingCid = requests.find(request =>
    request.status === 'Pending' && request.inGameCid.trim().toLowerCase() === normalizedCid
  );
  if (pendingCid) return { error: 'This CID already has a pending request.' };

  const rosterCid = (state.members || []).find(member => member.cid?.trim().toLowerCase() === normalizedCid);
  if (rosterCid) {
    return {
      error: rosterCid.accountName
        ? 'This CID is already associated with a website account.'
        : 'This CID is already on the roster without a verified website-account mapping and requires administrative recovery.'
    };
  }

  const accountLinked = (state.members || []).find(member =>
    member.accountName?.trim().toLowerCase() === normalizedUsername
  );
  if (accountLinked) return { error: 'This website account is already associated with a roster CID.' };
  return null;
}

export function validateApplication(input: unknown): ValidationResult<Omit<RecruitmentApplication, 'id' | 'date' | 'status'>> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Enlistment application must be a JSON object.' };
  }
  const application = input as Partial<RecruitmentApplication>;
  const applicantName = String(application.applicantName || '').trim();
  if (!applicantName || applicantName.length > 100 || application.rulesAccepted !== true) {
    return { ok: false, error: 'A valid applicant name and acceptance of the application agreements are required.' };
  }
  if (!Number.isInteger(application.age) || (application.age || 0) < 13 || !Number.isFinite(application.playtimeHours) || (application.playtimeHours || 0) < 0) {
    return { ok: false, error: 'Application age and playtime values are invalid.' };
  }
  return { ok: true, value: { ...application, applicantName } as Omit<RecruitmentApplication, 'id' | 'date' | 'status'> };
}

export function validateAsset(input: unknown): ValidationResult<USSFAssetItem> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Asset must be a JSON object.' };
  }
  const asset = input as Partial<USSFAssetItem>;
  const typeIsValid = asset.type === 'SKIN' || asset.type === 'VEHICLE_SHADER';
  const categoryIsValid = ['Infantry', 'Special Forces', 'Command', 'Vehicle'].includes(asset.category || '');
  const imageUrl = String(asset.imageUrl || '').trim();
  const validImageUrl = imageUrl.startsWith('/') || (() => {
    try {
      return new URL(imageUrl).protocol === 'https:';
    } catch {
      return false;
    }
  })();
  if (!asset.id || asset.id.length > 120 || !typeIsValid || !asset.title?.trim() || asset.title.length > 160 ||
      !asset.codeOrId?.trim() || asset.codeOrId.length > 120 || !categoryIsValid || !imageUrl || imageUrl.length > 2048 || !validImageUrl ||
      !asset.description?.trim() || asset.description.length > 1000 ||
      (asset.variantCount !== undefined && (!Number.isInteger(asset.variantCount) || asset.variantCount < 1 || asset.variantCount > 10))) {
    return { ok: false, error: 'Asset details are invalid.' };
  }
  return { ok: true, value: { ...asset, imageUrl } as USSFAssetItem };
}
