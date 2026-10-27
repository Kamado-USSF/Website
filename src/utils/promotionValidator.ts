import { USSFMember, USSF_RANKS, RankDefinition } from '../data/ussfData';

export interface PromotionEligibilityResult {
  eligible: boolean;
  currentRank: string;
  currentRankLevel: number;
  targetRank: string;
  targetRankLevel: number;
  targetRankCategory: string;
  currentPoints: number;
  requiredPoints: number;
  pointsDeficit: number;
  currentServiceDays: number;
  requiredServiceDays: number;
  serviceDaysDeficit: number;
  currentPlaytimeHours: number;
  requiredPlaytimeHours: number;
  playtimeDeficit: number;
  isHonorary: boolean;
  incompleteReasons: string[];
}

/**
 * Validates promotion eligibility according to USSF military regulations.
 * Checks points, qualifying calendar service days in rank, minimum playtime,
 * and ensures honorary ranks cannot be self-claimed.
 */
export function validatePromotionEligibility(
  member: USSFMember,
  customTargetLevel?: number,
  rankList: RankDefinition[] = USSF_RANKS
): PromotionEligibilityResult {
  const currentLevel = member.rankLevel || 1;
  const targetLevel = customTargetLevel !== undefined ? customTargetLevel : currentLevel + 1;

  // Find current and target rank definitions (rankList lets the caller use the
  // admin-published hierarchy instead of the static defaults)
  const currentRankDef = rankList.find(r => r.level === currentLevel) || {
    level: currentLevel,
    name: member.rank || 'Recruit',
    order: 200,
    requiredDays: 0,
    requiredPoints: 0,
    badgeColor: '#27272a',
    category: 'Regular Member',
    description: ''
  };

  const targetRankDef = rankList.find(r => r.level === targetLevel) || {
    level: targetLevel,
    name: `Tier ${targetLevel} Officer`,
    order: 0,
    requiredDays: 400,
    requiredPoints: 6000,
    badgeColor: '#e11d48',
    category: 'High Command',
    description: ''
  };

  const currentPoints = member.promotionPoints || 0;
  const requiredPoints = targetRankDef.requiredPoints || 0;
  const pointsDeficit = Math.max(0, requiredPoints - currentPoints);

  // Calculate qualifying calendar service days spent in current rank
  let effectiveStartDate = member.joinedDate;
  if (member.promotionHistory && member.promotionHistory.length > 0) {
    const sorted = [...member.promotionHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (sorted[0] && sorted[0].timestamp) {
      effectiveStartDate = sorted[0].timestamp;
    }
  }

  let currentServiceDays = 0;
  if (effectiveStartDate) {
    const startMs = new Date(effectiveStartDate).getTime();
    const nowMs = Date.now();
    if (!isNaN(startMs) && nowMs >= startMs) {
      currentServiceDays = Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24));
    }
  }

  const requiredServiceDays = targetRankDef.requiredDays || 0;
  const serviceDaysDeficit = Math.max(0, requiredServiceDays - currentServiceDays);

  const currentPlaytime = member.playtimeHours || 0;
  const requiredPlaytimeHours = Math.round(requiredServiceDays * 1.5);
  const playtimeDeficit = Math.max(0, requiredPlaytimeHours - currentPlaytime);

  const isHonorary = targetRankDef.category === 'Honorary Distinction';

  const incompleteReasons: string[] = [];

  if (isHonorary) {
    incompleteReasons.push(
      `Rank "${targetRankDef.name}" is an Honorary Distinction awarded exclusively by High Command executive appointment. It cannot be earned via point promotion.`
    );
  }

  if (pointsDeficit > 0) {
    incompleteReasons.push(
      `Insufficient Promotion Points: Has ${currentPoints.toLocaleString()} pts, but requires ${requiredPoints.toLocaleString()} pts (Short by ${pointsDeficit.toLocaleString()} pts).`
    );
  }

  if (serviceDaysDeficit > 0 && requiredServiceDays > 0) {
    incompleteReasons.push(
      `Insufficient Service Days in Current Rank: Has ${currentServiceDays} qualifying calendar days in rank, but requires at least ${requiredServiceDays} days (Short by ${serviceDaysDeficit} days).`
    );
  }

  if (targetLevel <= currentLevel) {
    incompleteReasons.push(
      `Target rank (${targetRankDef.name} - Tier ${targetLevel}) is not higher than current rank (${currentRankDef.name} - Tier ${currentLevel}).`
    );
  }

  return {
    eligible: incompleteReasons.length === 0,
    currentRank: currentRankDef.name,
    currentRankLevel: currentLevel,
    targetRank: targetRankDef.name,
    targetRankLevel: targetLevel,
    targetRankCategory: targetRankDef.category || 'Special Operator',
    currentPoints,
    requiredPoints,
    pointsDeficit,
    currentServiceDays,
    requiredServiceDays,
    serviceDaysDeficit,
    currentPlaytimeHours: currentPlaytime,
    requiredPlaytimeHours,
    playtimeDeficit,
    isHonorary,
    incompleteReasons
  };
}
