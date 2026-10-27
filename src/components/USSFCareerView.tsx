import React, { useState } from 'react';
import { USSF_RANKS, RankDefinition, USSFMember, AdminEvent, PromotionRequest } from '../data/ussfData';
import { Award, Shield, ChevronRight, CheckCircle2, Star, Calendar, Zap, ArrowRight, Medal, Crosshair, Terminal, Sparkles, Send, AlertCircle, Clock } from 'lucide-react';
import { tacticalAudio } from '../utils/audioSynth';
import { validatePromotionEligibility } from '../utils/promotionValidator';

interface USSFCareerViewProps {
  currentUser?: USSFMember | null;
  ranks?: RankDefinition[];
  members?: USSFMember[];
  events?: AdminEvent[];
  onSubmitPromotionRequest?: (req: PromotionRequest) => void;
  promotionRequests?: PromotionRequest[];
  onResolvePromotionRequest?: (id: string, approved: boolean) => void;
}

export const USSFCareerView: React.FC<USSFCareerViewProps> = ({
  currentUser,
  ranks = USSF_RANKS,
  members = [],
  events = [],
  onSubmitPromotionRequest,
  promotionRequests = [],
  onResolvePromotionRequest
}) => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'history' | 'request' | 'calculator' | 'approvalQueue'>('hierarchy');
  const [inputDays, setInputDays] = useState<number>(30);
  const [inputPoints, setInputPoints] = useState<number>(300);

  // High Command and authorized Officers (Level 15+) have promotion approval authority
  const isLeader = Boolean(
    currentUser &&
    currentUser.isMember &&
    !currentUser.isApplicant &&
    currentUser.status !== 'Applicant' &&
    (
      currentUser.isOwner ||
      currentUser.isAdmin ||
      (currentUser.specialRoles && currentUser.specialRoles.length > 0) ||
      (currentUser.rankLevel && currentUser.rankLevel >= 15) ||
      currentUser.rankCategory === 'High Command'
    )
  );

  const pendingRequests = (promotionRequests || []).filter(r => r.status === 'Pending');

  // Active Member for Promotion Submission - No dummy fallback or fabricated 1000 points
  const isMemberActive = Boolean(currentUser && currentUser.isMember && !currentUser.isApplicant);
  const effectiveMember: USSFMember = isMemberActive && currentUser ? currentUser : {
    id: 'civilian-guest',
    name: currentUser?.name || 'Civilian Account',
    cid: 'SF-CIV',
    callsign: 'Civilian',
    rank: 'Civilian Guest',
    rankLevel: 0,
    rankCategory: 'Regular Member',
    division: 'Unassigned',
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'Inactive',
    promotionPoints: 0,
    totalPayout: 0,
    arrestCount: 0,
    patrolHours: 0,
    playtimeHours: 0,
    serviceRibbons: [],
    avatarUrl: '/src/assets/images/special_forces_unit_1790346782492.jpg',
    avatarFrame: 'Recruit Ring',
    namecard: 'Civilian Visitor',
    nameStyle: 'standard',
    bio: 'Civilian account.',
    customCursor: 'crosshair-laser'
  };

  const [selectedTargetRankLevel, setSelectedTargetRankLevel] = useState<number>(2); // Default target Rank 2 Private First Class
  const [promotionProofUrl, setPromotionProofUrl] = useState('');
  const [promotionNote, setPromotionNote] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Check for active promotion multiplier events (2X, 3X, 4X Promotion Points)
  const activePromoEvent = events.find(e => 
    e.isActive && (
      e.multiplierType.includes('Promotion') || 
      e.multiplierType === '2X Promotion Points' ||
      e.multiplierType === '3X Promotion Points' ||
      e.multiplierType === '4X Promotion Points'
    )
  );

  const promoMultiplier = activePromoEvent 
    ? (activePromoEvent.multiplier || (activePromoEvent.multiplierType.includes('4X') ? 4 : activePromoEvent.multiplierType.includes('3X') ? 3 : 2))
    : 1;

  // Determine qualified rank based on input days and points for Calculator
  const qualifiedRank = [...ranks]
    .sort((a, b) => b.level - a.level)
    .find(r => inputDays >= r.requiredDays && inputPoints >= r.requiredPoints) || ranks[ranks.length - 1];

  // Promotion Calculation logic
  const currentRankDef = ranks.find(r => r.name === effectiveMember.rank) || ranks.find(r => r.level === effectiveMember.rankLevel) || ranks[ranks.length - 1];
  const targetRankDef = ranks.find(r => r.level === selectedTargetRankLevel) || ranks[0];

  // Calculate points cost: sum of incremental requirements or target rank point requirement
  const intermediateRanks = ranks.filter(r => r.level > currentRankDef.level && r.level <= targetRankDef.level);
  const pointsCost = intermediateRanks.reduce((sum, r) => sum + (r.requiredPoints || 100), 0) || (targetRankDef.requiredPoints || 300);
  const memberPoints = effectiveMember.promotionPoints || 0; // Strictly zero points for fresh accounts
  const remainingPoints = memberPoints - pointsCost;

  // Real dual promotion validation: points and qualifying calendar service days in current rank
  const validation = effectiveMember.rankLevel > 0
    ? validatePromotionEligibility(effectiveMember, targetRankDef.level, ranks)
    : {
        eligible: false,
        currentServiceDays: 0,
        requiredDays: targetRankDef.requiredDays,
        pointsDeficit: pointsCost,
        serviceDaysDeficit: targetRankDef.requiredDays,
        incompleteReasons: ['Civilian account: USSF enlistment application required.']
      };

  const isPointsEligible = validation.pointsDeficit <= 0;
  const isDaysEligible = validation.serviceDaysDeficit <= 0;
  const isPromotionEligible = isMemberActive && validation.eligible;

  const memberServiceDays = React.useMemo(() => {
    let effectiveStartDate = effectiveMember.joinedDate;
    if (effectiveMember.promotionHistory && effectiveMember.promotionHistory.length > 0) {
      const sorted = [...effectiveMember.promotionHistory].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      if (sorted[0]?.timestamp) effectiveStartDate = sorted[0].timestamp;
    }
    if (!effectiveStartDate) return 0;
    const startMs = new Date(effectiveStartDate).getTime();
    const nowMs = Date.now();
    return !isNaN(startMs) && nowMs >= startMs ? Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24)) : 0;
  }, [effectiveMember]);

  const nextEligibleRank = React.useMemo(() => {
    const curLevel = effectiveMember.rankLevel || 1;
    return ranks.find(r => r.level > curLevel && (r.requiredDays > 0 || r.requiredPoints > 0));
  }, [effectiveMember.rankLevel]);

  const handlePromotionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMemberActive) {
      tacticalAudio.playAlertWarning();
      alert('Action Denied: Only verified active USSF members may submit promotion requests. Please apply for enlistment or link your account.');
      return;
    }
    if (!validation.eligible) {
      tacticalAudio.playAlertWarning();
      alert(`Promotion Ineligible:\n${validation.incompleteReasons.join('\n')}`);
      return;
    }

    tacticalAudio.playTargetLock();

    const newReq: PromotionRequest = {
      id: `pr-${Date.now()}`,
      operatorName: effectiveMember.name,
      operatorCid: effectiveMember.cid,
      currentRank: effectiveMember.rank,
      targetRank: targetRankDef.name,
      targetRankLevel: targetRankDef.level,
      pointsCost,
      remainingPoints: Math.max(0, remainingPoints),
      currentPoints: memberPoints,
      submissionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Pending',
      notes: promotionNote || (promotionProofUrl ? `Proof: ${promotionProofUrl}` : 'Point milestone reached')
    };

    if (onSubmitPromotionRequest) {
      onSubmitPromotionRequest(newReq);
    }

    setSubmissionSuccess(`Promotion request for ${targetRankDef.name} (Cost: ${pointsCost.toLocaleString()} Pts, Saved Extra: ${Math.max(0, remainingPoints).toLocaleString()} Pts) submitted to High Command Admin Queue!`);
    setTimeout(() => setSubmissionSuccess(null), 8000);
    setPromotionProofUrl('');
    setPromotionNote('');
  };

  return (
    <div className="w-full bg-[#080a08] text-neutral-100 min-h-screen pb-16">
      {/* High-Impact Tactical Rank Medals Hero Banner */}
      <div className="relative w-full overflow-hidden border-b border-neutral-800 bg-[#0c100d]">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/tactical_rank_medals_1790346811864.jpg"
            alt="Special Forces Officer Ranks and Commendation Honors"
            className="h-full w-full object-cover object-center filter brightness-45 contrast-125 saturate-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080a08] via-[#080a08]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080a08] via-[#080a08]/80 to-transparent" />
          <div className="absolute inset-0 scanlines-overlay opacity-30 pointer-events-none" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-data uppercase tracking-widest text-neutral-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  SPECIAL FORCES
                </span>
                <span className="text-neutral-600">/</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Medal className="h-3.5 w-3.5 text-amber-400" />
                  CAREER & PROMOTION HIERARCHY
                </span>
                <span className="text-neutral-600">/</span>
                <span className="text-neutral-300">CIT2 LAW GROUP</span>
              </div>

              <div className="relative inline-block">
                <div className="absolute -top-2 -left-2 h-4 w-4 border-t-2 border-l-2 border-amber-500" />
                <div className="absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 border-amber-500" />
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-tactical uppercase tracking-tight text-white drop-shadow-lg">
                  Promotion Path
                </h1>
              </div>

              <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed max-w-2xl">
                Official CIT2 Special Forces hierarchy and rank progression. Operators can submit promotion requests to High Command upon reaching point milestones. If you have surplus points, all extra points are safely preserved in your treasury record!
              </p>
            </div>

            {/* Quick Stat Pill */}
            <div className="rounded-xl border border-neutral-800 bg-[#121612]/90 backdrop-blur px-6 py-4 flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] font-data text-neutral-400 uppercase tracking-wider">
                OFFICIAL TIERS
              </span>
              <span className="text-4xl font-bold font-data text-amber-400 tabular-nums">
                20
              </span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                tacticalAudio.playTacticalClick();
                setActiveTab('hierarchy');
              }}
              className={`px-4 py-2 rounded text-xs font-tactical uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'bg-neutral-100 text-neutral-950 font-bold shadow-lg'
                  : 'bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Full Rank Hierarchy (20 Tiers)
            </button>

            <button
              onClick={() => {
                tacticalAudio.playTacticalClick();
                setActiveTab('history');
              }}
              className={`px-4 py-2 rounded text-xs font-tactical uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-neutral-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-900/80 border border-neutral-800 text-amber-400 hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Promotion History ({effectiveMember.promotionHistory?.length || 0})</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playTacticalClick();
                setActiveTab('request');
              }}
              className={`px-4 py-2 rounded text-xs font-tactical uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'request'
                  ? 'bg-amber-500 text-neutral-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-900/80 border border-neutral-800 text-amber-400 hover:text-white'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Promotion Request</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playTacticalClick();
                setActiveTab('calculator');
              }}
              className={`px-4 py-2 rounded text-xs font-tactical uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-neutral-100 text-neutral-950 font-bold shadow-lg'
                  : 'bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Promotion Eligibility Calculator
            </button>

            {isLeader && (
              <button
                onClick={() => {
                  tacticalAudio.playTacticalClick();
                  setActiveTab('approvalQueue');
                }}
                className={`px-4 py-2 rounded text-xs font-tactical uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'approvalQueue'
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-amber-950/40 border border-amber-500/60 text-amber-300 hover:text-white'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>COMMAND QUEUE ({pendingRequests.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        {/* Active Promotion Points Boost Event Notification */}
        {activePromoEvent && (
          <div className="p-4 rounded-xl border border-amber-500/80 bg-gradient-to-r from-amber-950/80 via-neutral-900 to-black text-amber-300 font-data text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-500 text-neutral-950 font-black text-sm">
                {promoMultiplier}X
              </div>
              <div>
                <span className="font-bold text-white uppercase text-sm block">
                  {activePromoEvent.title}
                </span>
                <span className="text-amber-200/90 text-xs">
                  {activePromoEvent.announcement || `Promotion points are currently multiplied by ${promoMultiplier}X! Accelerate your rank ascension.`}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 uppercase block font-mono">PROMOTION BOOST</span>
              <span className="text-emerald-400 font-bold">{promoMultiplier}X POINTS BOOSTED</span>
            </div>
          </div>
        )}

        {submissionSuccess && (
          <div className="p-4 rounded-xl border border-emerald-500/60 bg-emerald-950/60 text-emerald-300 font-data text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{submissionSuccess}</span>
          </div>
        )}

        {/* TAB 1: SUBMIT PROMOTION REQUEST (With Point Saving Logic & Dual Days/Points Validation) */}
        {activeTab === 'request' && (
          !isMemberActive ? (
            <div className="p-8 md:p-12 rounded-2xl border border-amber-500/60 bg-[#0d100d] text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
              <Shield className="h-12 w-12 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <span className="text-[10px] font-data text-amber-400 uppercase tracking-widest font-bold">
                  SECURITY CLEARANCE NOTICE // CIVILIAN ACCOUNT
                </span>
                <h3 className="text-xl md:text-2xl font-tactical font-black uppercase text-white">
                  ENLISTMENT REQUIRED FOR PROMOTION ADVANCEMENT
                </h3>
              </div>
              <p className="text-xs text-neutral-300 font-sans max-w-md mx-auto leading-relaxed">
                Advancement through the 20 Special Forces rank tiers requires an active, commissioned member dossier. Unlinked civilian accounts start at Tier 0 with 0 points.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const recruitmentTab = document.querySelector('button[data-view="recruitment"]') as HTMLElement;
                    if (recruitmentTab) recruitmentTab.click();
                    else window.location.hash = 'recruitment';
                  }}
                  className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-tactical font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
                >
                  GO TO ENLISTMENT & ACCOUNT LINKING
                </button>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 md:p-8 space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-xs font-data text-amber-400 uppercase tracking-widest font-bold block mb-1">
                  OFFICIAL ADVANCEMENT COMMISSION
                </span>
                <h2 className="text-2xl font-bold font-tactical uppercase text-white">
                  SUBMIT PROMOTION REQUEST
                </h2>
                <p className="text-xs text-neutral-300 font-sans mt-1">
                  Request rank elevation upon meeting separate requirements for promotion points AND qualifying calendar service days in current rank. Excess points are safely banked!
                </p>
              </div>

              {/* Operator Points & Time in Rank Dossier Banner */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 grid grid-cols-2 gap-4 font-data text-xs">
                <div>
                  <span className="text-neutral-500 uppercase text-[10px] block">OPERATOR IDENTITY</span>
                  <div className="text-white font-bold text-sm">{effectiveMember.name}</div>
                  <div className="text-amber-400 text-xs">{effectiveMember.rank} (Lvl {effectiveMember.rankLevel})</div>
                </div>

                <div className="text-right">
                  <span className="text-neutral-500 uppercase text-[10px] block">YOUR TOTAL POINTS</span>
                  <div className="text-2xl font-black font-tactical text-emerald-400">
                    {memberPoints.toLocaleString()} PTS
                  </div>
                </div>
              </div>

              {/* Dual Qualification Requirements Audit */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/80 space-y-3 font-data text-xs">
                <span className="text-neutral-400 uppercase text-[10px] font-bold block tracking-wider">
                  DUAL ADVANCEMENT REQUIREMENTS FOR {targetRankDef.name.toUpperCase()}
                </span>
                
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-300">1. Promotion Points:</span>
                    <span className="font-bold text-white">{memberPoints.toLocaleString()} / {pointsCost.toLocaleString()} Pts</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    isPointsEligible ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50' : 'bg-rose-950 text-rose-400 border border-rose-500/50'
                  }`}>
                    {isPointsEligible ? 'QUALIFIED' : `-${validation.pointsDeficit} PTS DEFICIT`}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-300">2. Service Days in Current Rank:</span>
                    <span className="font-bold text-white">{validation.currentServiceDays} / {targetRankDef.requiredDays} Days</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    isDaysEligible ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50' : 'bg-rose-950 text-rose-400 border border-rose-500/50'
                  }`}>
                    {isDaysEligible ? 'QUALIFIED' : `-${validation.serviceDaysDeficit} DAYS DEFICIT`}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePromotionSubmit} className="space-y-4 text-xs font-data">
                <div>
                  <label className="text-neutral-400 uppercase font-bold block mb-1">
                    SELECT DESIRED TARGET RANK *
                  </label>
                  <select
                    value={selectedTargetRankLevel}
                    onChange={(e) => setSelectedTargetRankLevel(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-neutral-200 text-xs focus:outline-none focus:border-amber-400"
                  >
                    {ranks.filter(r => r.level > effectiveMember.rankLevel).map(r => (
                      <option key={r.level} value={r.level}>
                        Level {r.level}: {r.name} (Req: {r.requiredPoints.toLocaleString()} pts / {r.requiredDays} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 uppercase font-bold block mb-1">
                    VERIFIED F5 SCOREBOARD / GROUP SCORE PROOF URL
                  </label>
                  <input
                    type="url"
                    value={promotionProofUrl}
                    onChange={(e) => setPromotionProofUrl(e.target.value)}
                    placeholder="https://imgur.com/your-f5-scores-proof.jpg"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 uppercase font-bold block mb-1">
                    SERVICE HIGHLIGHTS & NOTES (OPTIONAL)
                  </label>
                  <textarea
                    rows={2}
                    value={promotionNote}
                    onChange={(e) => setPromotionNote(e.target.value)}
                    placeholder="Summary of recent patrols, APB arrests, or team hostings..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isPromotionEligible}
                  className={`w-full py-3 rounded-lg font-tactical font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                    isPromotionEligible
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isPromotionEligible
                      ? `SUBMIT PROMOTION TO ${targetRankDef.name.toUpperCase()}`
                      : !isPointsEligible
                      ? `INSUFFICIENT POINTS (NEED ${validation.pointsDeficit.toLocaleString()} MORE)`
                      : `TIME IN RANK REQUIREMENT NOT MET (NEED ${validation.serviceDaysDeficit} MORE DAYS)`}
                  </span>
                </button>
              </form>
            </div>

            {/* Point Saving Calculation Card */}
            <div className="lg:col-span-6 rounded-2xl border border-neutral-800 bg-[#0d110d] p-6 md:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs font-data mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span>AUTOMATIC POINT PRESERVATION AUDIT</span>
                </div>

                <h3 className="text-2xl font-tactical font-black uppercase text-white">
                  {targetRankDef.name} Breakdown
                </h3>

                <p className="text-xs text-neutral-300 font-sans mt-2">
                  Under Special Forces doctrine, elevating your rank deducts only the required point tier costs while automatically crediting and saving all remaining points to your profile.
                </p>

                {/* Calculation Table */}
                <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 font-data text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-neutral-400">
                    <span>Current Banked Points</span>
                    <span className="font-bold text-white">{memberPoints.toLocaleString()} Pts</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-rose-400">
                    <span>Rank Points Cost</span>
                    <span className="font-bold">-{pointsCost.toLocaleString()} Pts</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-sm font-bold">
                    <span className="text-emerald-400">Remaining Saved Points</span>
                    <span className="text-emerald-400 tabular-nums">
                      {isPointsEligible ? `${remainingPoints.toLocaleString()} Pts` : '0 Pts (Shortfall)'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs font-data text-neutral-400 space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Example Point Preservation:</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    If an operator has 1,000 points and requests advancement requiring 800 points, 800 points are deducted and the remaining 200 points are preserved safely for future rank tiers.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 text-[11px] font-data text-neutral-500 flex items-center justify-between">
                <span>SPECIAL FORCES CAREER PROTOCOL</span>
                <span className="text-amber-400">CIT2 LAW GROUP</span>
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB 2: FULL RANK HIERARCHY */}
        {activeTab === 'hierarchy' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 flex flex-wrap items-center justify-between gap-2 text-xs font-data text-neutral-400">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>CIT2 Law Side Group Standards · High Command Directives</span>
              </span>
              <span className="text-amber-400 font-semibold">Order 0 = Highest Rank (High Commander)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ranks.map((rank) => (
                <div
                  key={rank.level}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 hover:border-neutral-700 transition-all group relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: rank.badgeColor }}
                  />

                  <div className="flex items-center justify-between text-xs font-data mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${rank.badgeColor}20`,
                        color: rank.badgeColor,
                        border: `1px solid ${rank.badgeColor}40`
                      }}
                    >
                      LEVEL {rank.level}
                    </span>
                    <span className="text-neutral-500 font-data">
                      ORDER #{rank.order}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold font-tactical uppercase text-neutral-100 group-hover:text-amber-300 transition-colors">
                    {rank.name}
                  </h3>

                  <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-xs font-data text-neutral-400">
                    <div className="bg-neutral-950/60 p-2.5 rounded border border-neutral-800/60">
                      <div className="text-[10px] text-neutral-500 uppercase">REQ. DAYS</div>
                      <div className="text-sm font-bold text-neutral-200 tabular-nums">
                        {rank.requiredDays > 0 ? `${rank.requiredDays} Days` : 'Discretionary'}
                      </div>
                    </div>

                    <div className="bg-neutral-950/60 p-2.5 rounded border border-neutral-800/60">
                      <div className="text-[10px] text-neutral-500 uppercase">REQ. POINTS</div>
                      <div className="text-sm font-bold text-emerald-400 tabular-nums">
                        {rank.requiredPoints > 0 ? `${rank.requiredPoints.toLocaleString()} pts` : 'High Command'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PROMOTION HISTORY LOG FOR LOGGED-IN OPERATOR */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-xl border border-neutral-800 bg-[#0d100d] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-data uppercase tracking-wider text-amber-400 font-bold">
                  <Clock className="h-4 w-4" />
                  <span>OFFICIAL MILITARY PROMOTION RECORDS & SERVICE TIMELINE</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-tactical uppercase text-white">
                  CAREER PROMOTION HISTORY // {effectiveMember.name}[USSF]
                </h2>
                <p className="text-xs text-neutral-400 font-sans">
                  Official logged archive of all past successful rank commissions, merit awards, and officer appointments recorded on CIT2.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-right">
                  <span className="text-[10px] font-data text-neutral-500 uppercase block">CURRENT COMMISSION</span>
                  <span className="text-base font-tactical font-black text-amber-400 uppercase">
                    {effectiveMember.rank} (Tier {effectiveMember.rankLevel})
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Entries */}
            {effectiveMember.promotionHistory && effectiveMember.promotionHistory.length > 0 ? (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-500/40 space-y-6 my-4 ml-4">
                {effectiveMember.promotionHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative group">
                    {/* Glowing Bullet Node */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-6 w-6 rounded-full bg-neutral-950 border-2 border-amber-500 flex items-center justify-center text-amber-400 text-xs shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                      ★
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 hover:border-amber-500/60 p-5 transition-all shadow-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-data font-bold bg-amber-500 text-neutral-950 uppercase">
                            TIER {item.rankLevel} COMMISSION
                          </span>
                          <h3 className="font-tactical font-black text-lg text-white">
                            {item.rankTitle}
                          </h3>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/40">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{item.timestamp}</span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-data">
                        <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800">
                          <span className="text-neutral-500 text-[10px] uppercase block">APPROVING OFFICER</span>
                          <span className="text-amber-400 font-bold">{item.approvingOfficer}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800">
                          <span className="text-neutral-500 text-[10px] uppercase block">POINTS DEDUCTED</span>
                          <span className="text-neutral-200 font-bold">{item.pointsUsed.toLocaleString()} Points</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 sm:col-span-2 md:col-span-1">
                          <span className="text-neutral-500 text-[10px] uppercase block">STATUS VERIFICATION</span>
                          <span className="text-emerald-400 font-bold">100% In-Game Verified</span>
                        </div>
                      </div>

                      {/* Official Citation */}
                      {item.citation && (
                        <div className="pt-1 text-xs font-sans italic text-neutral-300 border-l-2 border-amber-500/50 pl-3">
                          "{item.citation}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4">
                <Clock className="h-10 w-10 text-neutral-600 mx-auto" />
                <h3 className="font-tactical font-bold text-lg text-neutral-300 uppercase">
                  NO PROMOTION HISTORY RECORDED YET
                </h3>
                <p className="text-xs text-neutral-500 font-sans max-w-md mx-auto">
                  Promotion records appear here once High Command or a Promotion Manager verifies and approves your rank advancement.
                </p>
                <button
                  onClick={() => setActiveTab('request')}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-tactical font-black text-xs uppercase cursor-pointer"
                >
                  SUBMIT YOUR FIRST PROMOTION REQUEST
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROMOTION ELIGIBILITY CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-8">
            {/* Operator Dossier Summary & Sync Panel */}
            <div className="rounded-xl border border-neutral-800 bg-[#0d100d] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-data">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-bold uppercase">
                    ACTIVE DOSSIER: {effectiveMember.name} [{effectiveMember.cid}]
                  </span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-amber-400 font-semibold">
                    Current: {effectiveMember.rank} (Tier {effectiveMember.rankLevel})
                  </span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-neutral-300">
                    Next Target: {nextEligibleRank ? `${nextEligibleRank.name} (Tier ${nextEligibleRank.level})` : '★ Maximum Rank (High Commander) Achieved'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-sans">
                  Official USSF eligibility engine calculates qualifications across all 20 ranks. Calculated qualification does not automatically commission promotions; official review and approval by High Command or an Administrator is required.
                </p>
              </div>

              {isMemberActive && (
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playTacticalClick();
                    setInputDays(memberServiceDays);
                    setInputPoints(effectiveMember.promotionPoints || 0);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:text-white font-tactical font-black text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-2"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>LOAD MY DOSSIER ({memberServiceDays}d / {(effectiveMember.promotionPoints || 0).toLocaleString()}p)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-tactical uppercase text-neutral-100">
                    Promotion Eligibility Calculator
                  </h2>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed mt-1">
                    Enter your total active Special Forces service days and CIT2 verified points from the group F5 panel to calculate your qualification across all 20 ranks.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Days Input */}
                  <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-data">
                      <span className="text-neutral-300 font-bold uppercase">ACTIVE SERVICE DAYS</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={inputDays}
                          onChange={(e) => setInputDays(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-right font-bold text-amber-400 text-xs font-mono focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-neutral-400">Days</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="400"
                      value={Math.min(400, inputDays)}
                      onChange={(e) => setInputDays(Number(e.target.value))}
                      className="w-full accent-amber-500 h-2 bg-neutral-800 rounded cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-data text-neutral-500">
                      <span>0d (Recruit)</span>
                      <span>140d (Captain)</span>
                      <span>210d (VCMD)</span>
                      <span>365d (High Commander)</span>
                    </div>
                  </div>

                  {/* Points Input */}
                  <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-data">
                      <span className="text-neutral-300 font-bold uppercase">GROUP F5 PROMOTION POINTS</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="20000"
                          step="25"
                          value={inputPoints}
                          onChange={(e) => setInputPoints(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-24 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-right font-bold text-emerald-400 text-xs font-mono focus:outline-none focus:border-emerald-400"
                        />
                        <span className="text-neutral-400">Pts</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6000"
                      step="25"
                      value={Math.min(6000, inputPoints)}
                      onChange={(e) => setInputPoints(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-data text-neutral-500">
                      <span>0 Pts</span>
                      <span>1,100 (2LT)</span>
                      <span>3,100 (VCMD)</span>
                      <span>5,500 Pts (HCMD)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Box */}
              <div className="lg:col-span-6 rounded-xl border border-neutral-800 bg-[#121612] p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-data uppercase tracking-wider text-emerald-400 mb-2 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>HIGHEST QUALIFIED RANK LEVEL</span>
                  </div>

                  <div className="text-3xl md:text-5xl font-black font-tactical uppercase text-neutral-100 mb-2">
                    {qualifiedRank.name}
                  </div>

                  <div
                    className="inline-block px-3 py-1 rounded text-xs font-data font-bold uppercase tracking-wider mb-4"
                    style={{
                      backgroundColor: `${qualifiedRank.badgeColor}25`,
                      color: qualifiedRank.badgeColor,
                      border: `1px solid ${qualifiedRank.badgeColor}50`
                    }}
                  >
                    RANK LEVEL {qualifiedRank.level} · {qualifiedRank.category || 'Regular'} · ORDER #{qualifiedRank.order}
                  </div>

                  <div className="space-y-3 text-xs font-sans text-neutral-300">
                    <p>
                      With <strong className="text-white font-data">{inputDays} active days</strong> and <strong className="text-white font-data">{inputPoints.toLocaleString()} points</strong>, you satisfy baseline qualifications for <strong className="text-amber-400 font-bold">{qualifiedRank.name}</strong> (Requires {qualifiedRank.requiredDays}d / {qualifiedRank.requiredPoints.toLocaleString()}p).
                    </p>

                    {/* Next Rank Deficit */}
                    {(() => {
                      const nextRank = [...ranks].sort((a, b) => a.level - b.level).find(r => r.level > qualifiedRank.level && (r.requiredDays > 0 || r.requiredPoints > 0));
                      if (!nextRank) {
                        return (
                          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-data">
                            👑 Maximum achievable rank tier attained! High Commander is the supreme rank in the United States Special Forces doctrine.
                          </div>
                        );
                      }
                      const daysNeeded = Math.max(0, nextRank.requiredDays - inputDays);
                      const pointsNeeded = Math.max(0, nextRank.requiredPoints - inputPoints);
                      return (
                        <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5">
                          <span className="text-[10px] font-data text-neutral-400 uppercase block font-bold">NEXT ADVANCEMENT TARGET:</span>
                          <div className="flex items-center justify-between text-xs font-data">
                            <span className="text-amber-400 font-bold">{nextRank.name} (Lvl {nextRank.level})</span>
                            <span className="text-neutral-400 font-mono">{nextRank.requiredDays}d / {nextRank.requiredPoints.toLocaleString()}p</span>
                          </div>
                          <div className="text-[11px] font-data text-neutral-300">
                            Deficit: <span className="text-amber-300 font-bold">+{daysNeeded} days</span> and <span className="text-emerald-300 font-bold">+{pointsNeeded.toLocaleString()} points</span>.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-neutral-800 text-xs font-data text-neutral-500 flex items-center justify-between">
                  <span>SPECIAL FORCES RANK DOCTRINE</span>
                  <span className="text-amber-400 font-bold">ALL 20 RANKS COVERAGE</span>
                </div>
              </div>
            </div>

            {/* Comprehensive All 20 Ranks Qualification Breakdown Table */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="font-tactical font-black text-lg text-white uppercase flex items-center gap-2">
                    <Medal className="h-5 w-5 text-amber-400" />
                    <span>FULL 20-RANK QUALIFICATION MATRIX</span>
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Live evaluation of your entered {inputDays} Days and {inputPoints.toLocaleString()} Points against every tier in the official USSF hierarchy.
                  </p>
                </div>
                <span className="text-[11px] font-data text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full self-start sm:self-auto">
                  Calculated against {inputDays}d & {inputPoints.toLocaleString()}p
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-data">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-[10px] uppercase">
                      <th className="py-2.5 px-3">Level</th>
                      <th className="py-2.5 px-3">Rank Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Required Days</th>
                      <th className="py-2.5 px-3">Required Points</th>
                      <th className="py-2.5 px-3 text-right">Status / Deficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {[...ranks].sort((a, b) => b.level - a.level).map(rank => {
                      const isSpecialAppointment = rank.requiredDays === 0 && rank.requiredPoints === 0 && rank.level > 1;
                      const hasDays = inputDays >= rank.requiredDays;
                      const hasPoints = inputPoints >= rank.requiredPoints;
                      const isFullyQualified = !isSpecialAppointment && hasDays && hasPoints;
                      const isCurrentHighest = qualifiedRank.level === rank.level;
                      const missingDays = Math.max(0, rank.requiredDays - inputDays);
                      const missingPoints = Math.max(0, rank.requiredPoints - inputPoints);

                      return (
                        <tr
                          key={rank.level}
                          className={`transition-colors ${
                            isCurrentHighest
                              ? 'bg-amber-950/40 border-l-4 border-amber-400'
                              : isFullyQualified
                              ? 'bg-emerald-950/15 hover:bg-emerald-950/30'
                              : 'hover:bg-neutral-800/40 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span
                              className="px-2 py-0.5 rounded text-[11px]"
                              style={{
                                backgroundColor: `${rank.badgeColor}25`,
                                color: rank.badgeColor,
                                border: `1px solid ${rank.badgeColor}50`
                              }}
                            >
                              LVL {rank.level}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{rank.name}</span>
                              {isCurrentHighest && (
                                <span className="text-[9px] bg-amber-400 text-neutral-950 font-black px-1.5 py-0.2 rounded uppercase">
                                  YOUR LEVEL
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-sans truncate max-w-xs">{rank.description}</div>
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400">{rank.category}</td>
                          <td className="py-2.5 px-3 font-mono">
                            {isSpecialAppointment ? (
                              <span className="text-pink-400 font-bold">Appointment Only</span>
                            ) : (
                              <span className={hasDays ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                                {rank.requiredDays} Days
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {isSpecialAppointment ? (
                              <span className="text-pink-400 font-bold">High Command Vote</span>
                            ) : (
                              <span className={hasPoints ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                                {rank.requiredPoints.toLocaleString()} Pts
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isSpecialAppointment ? (
                              <span className="px-2 py-0.5 rounded bg-pink-950/80 border border-pink-500/40 text-pink-300 font-bold text-[10px]">
                                COMMAND VOTE
                              </span>
                            ) : isFullyQualified ? (
                              <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                <span>QUALIFIED</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-mono">
                                Needs {missingDays > 0 ? `+${missingDays}d ` : ''}{missingPoints > 0 ? `+${missingPoints.toLocaleString()}p` : ''}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LEADER PROMOTION APPROVAL QUEUE (FIRST MAJOR+ AUTHORITY) */}
        {activeTab === 'approvalQueue' && isLeader && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-base font-tactical font-black uppercase text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  <span>LEADERSHIP PROMOTION REVIEW & COMMISSIONING QUEUE</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-sans">
                  As an official USSF Leader (First Major+), you have operational authority to evaluate and approve operator promotion submissions. Approving a promotion will automatically commission the operator and upgrade their official rank in the squadron roster!
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-data font-bold text-xs shrink-0 self-start sm:self-auto">
                {pendingRequests.length} PENDING APPLICATION{pendingRequests.length === 1 ? '' : 'S'}
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-neutral-800 rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-neutral-600 mx-auto" />
                <div className="text-sm font-tactical font-bold text-neutral-300 uppercase">All Promotion Requests Reviewed</div>
                <p className="text-xs text-neutral-500 font-data">Zero operator promotion submissions are currently awaiting approval in the queue.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-5 rounded-xl border border-neutral-800 bg-neutral-950/90 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-lg">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-base font-tactical uppercase">{req.operatorName}</span>
                        <span className="text-emerald-400 font-mono text-xs">({req.operatorCid})</span>
                        <span className="text-amber-300 font-bold bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded text-xs">
                          {req.currentRank} → 🎖️ {req.targetRank} (Tier {req.targetRankLevel})
                        </span>
                        {req.targetRankLevel >= 7 && (
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold text-[10px] uppercase">
                            ASCENDING TO LEADER
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-data text-neutral-300 flex flex-wrap items-center gap-4">
                        <span>Current Ledger: <strong className="text-white">{req.currentPoints.toLocaleString()} Pts</strong></span>
                        <span>Promotion Cost: <strong className="text-rose-400">-{req.pointsCost.toLocaleString()} Pts</strong></span>
                        <span>Preserved Balance: <strong className="text-emerald-400">{req.remainingPoints.toLocaleString()} Pts</strong></span>
                      </div>

                      <div className="text-[11px] text-neutral-400 font-sans border-l-2 border-neutral-700 pl-2 mt-1">
                        <span>Submitted on {req.submissionDate} · Note / Citation: <em>{req.notes || 'Activity milestones completed'}</em></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
                      <button
                        onClick={() => {
                          tacticalAudio.playTacticalClick();
                          if (onResolvePromotionRequest) onResolvePromotionRequest(req.id, false);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase cursor-pointer transition-colors"
                      >
                        DENY & REFUND
                      </button>
                      <button
                        onClick={() => {
                          tacticalAudio.playTargetLock();
                          if (onResolvePromotionRequest) onResolvePromotionRequest(req.id, true);
                        }}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase cursor-pointer shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>APPROVE & PROMOTE</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
