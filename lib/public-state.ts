import type { PersistentState } from './db.js';

export function toPublicState(state: PersistentState) {
  const {
    claims: _claims,
    fieldReports: _fieldReports,
    dms: _dms,
    linkRequests: _linkRequests,
    applications: _applications,
    forgotPwRequests: _forgotPwRequests,
    pendingLoginClaims: _pendingLoginClaims,
    promotionRequests: _promotionRequests,
    birthdayGifts: _birthdayGifts,
    squadGroups: _squadGroups,
    members,
    ...publicState
  } = state;

  const publicMembers = (members || []).map(member => ({
    id: member.id,
    cid: member.cid,
    name: member.name,
    callsign: member.callsign,
    rank: member.rank,
    rankLevel: member.rankLevel,
    rankCategory: member.rankCategory,
    division: member.division,
    joinedDate: member.joinedDate,
    status: member.status,
    presenceStatus: member.presenceStatus,
    serviceRibbons: member.serviceRibbons,
    avatarUrl: member.avatarUrl,
    avatarFrame: member.avatarFrame,
    namecard: member.namecard,
    namecardBgUrl: member.namecardBgUrl,
    nameStyle: member.nameStyle,
    isOnlineCit: member.isOnlineCit,
    bio: member.bio,
    signature: member.signature,
    customCursor: member.customCursor,
    isMember: member.isMember,
    isApplicant: member.isApplicant
  }));

  return { ...publicState, members: publicMembers };
}
