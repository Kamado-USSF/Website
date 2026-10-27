export type DiscordPresenceStatus = 'Online' | 'Idle' | 'DND' | 'Offline';

export type SpecialRole = 
  | 'Promotion Manager' 
  | 'Financial Manager' 
  | 'Administrator' 
  | 'Account Recovery Manager';

export interface PromotionHistoryEntry {
  id: string;
  rankTitle: string;
  rankLevel: number;
  timestamp: string;
  pointsUsed: number;
  approvingOfficer: string;
  citation?: string;
}

export interface USSFMember {
  id: string;
  cid: string;
  name: string;
  callsign: string;
  rank: string;
  rankLevel: number;
  rankCategory: 'High Command' | 'Field Command' | 'Special Operator' | 'Regular Member' | 'Civilian / Applicant';
  division: string;
  joinedDate: string;
  status: 'Active Duty' | 'On Mission' | 'Standby' | 'Applicant' | 'Inactive';
  presenceStatus?: DiscordPresenceStatus;
  promotionPoints: number;
  isOwner?: boolean;
  isAdmin?: boolean;
  isMember?: boolean;
  isApplicant?: boolean;
  totalPayout: number;
  arrestCount: number;
  patrolHours: number;
  playtimeHours: number;
  country?: string;
  age?: number;
  birthday?: string; // MM-DD
  serviceRibbons: string[];
  avatarUrl?: string;
  avatarFrame?: string;
  namecard?: string;
  namecardBgUrl?: string;
  nameStyle?: string;
  bio?: string;
  signature?: string;
  customCursor?: string;
  customTitle?: string;
  linkedInGame?: boolean;
  isOnlineWeb?: boolean;
  isOnlineCit?: boolean;
  discordTag?: string;
  accountName?: string;
  specialRoles?: SpecialRole[];
  promotionHistory?: PromotionHistoryEntry[];
  unlockedAvatarFrames?: string[];
  unlockedCursors?: string[];
  unlockedNamecards?: string[];
  unlockedTitles?: string[];
  leaderBio?: string;
  commandPhilosophy?: string;
  preferredWeapons?: string;
  timezone?: string;
}

export interface FieldReport {
  id: string;
  title: string;
  type: 'Patrol' | 'Training' | 'Combat' | 'Incident';
  hostName: string;
  hostCid: string;
  startTime?: string;
  endTime?: string;
  participants: string[];
  durationHours: number;
  date: string;
  status: 'Approved' | 'Pending Verification';
  summary: string;
  proofLink?: string;
  revenueEarned?: number;
  viewsCount?: number;
}

export type TaskFrequency = 'DAILY' | 'WEEKLY' | 'MULTI_DAILY' | 'ONCE_ONLY' | 'MONTHLY';

export interface RewardItem {
  id: string;
  category: 'Arrest Points' | 'Patrol & Training' | 'Combat & Tactical' | 'Daily & Specialist Tasks' | 'Promotions & Achievements';
  title: string;
  payoutAmount: number;
  frequency: TaskFrequency;
  description: string;
  allowQuantity?: boolean;
}

export interface FinancialClaim {
  id: string;
  rewardTitle: string;
  rewardCategory: string;
  amount: number;
  quantity?: number;
  claimantName: string;
  claimantCid: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Awaiting Review' | 'Rejected';
  proofUrl: string;
  note?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface RankDefinition {
  level: number;
  name: string;
  order: number;
  requiredDays: number;
  requiredPoints: number;
  badgeColor: string;
  unlockedFrame: string;
  unlockedNamecard: string;
  category?: string;
  description?: string;
}

export interface USSFAchievement {
  id: string;
  title: string;
  category: 'Service' | 'Combat' | 'Financial' | 'Promotion';
  description: string;
  progress: number;
  total: number;
  isUnlocked: boolean;
  unlockedDate?: string;
  imageUrl: string;
  rewardAmount: number;
  rewardPoints?: number;
}

export interface MilestoneRewardChoice {
  id: string;
  milestoneDay: 7 | 30;
  type: 'NAMECARD' | 'AVATAR_FRAME' | 'CUSTOM_CURSOR' | 'CASH_POINTS' | 'TITLE' | 'IN_GAME_ITEM';
  title: string;
  description: string;
  rewardValue: string;
  cashAmount?: number;
  promotionPoints?: number;
  previewImage?: string;
  quantity?: number;
}

export interface CustomCursorItem {
  id: string;
  name: string;
  category: 'Tactical' | 'Gaming & Anime' | 'Special Forces';
  cursorUrl: string;
  pointerUrl?: string;
  hotspot: [number, number]; // [x, y]
  pointerHotspot?: [number, number];
  previewImage: string;
  description: string;
}

export const CUSTOM_CURSORS_CATALOG: CustomCursorItem[] = [
  {
    id: 'solo-leveling',
    name: 'Solo Leveling: Shadow Monarch',
    category: 'Gaming & Anime',
    cursorUrl: '/assets/cursors/solo_leveling.png',
    pointerUrl: '/assets/cursors/solo_leveling_pointer.png',
    hotspot: [0, 0],
    pointerHotspot: [10, 0],
    previewImage: '/assets/aistudio/Solo_Leveling_Shadow_Arrow___Monarch_Hand_Animated_Cursor--cursor--SweezyCursors_493f92f5.png',
    description: 'Dark obsidian shadow dagger with purple monarch flame hand pointer.'
  },
  {
    id: 'halo-sword',
    name: 'Halo Energy Sword',
    category: 'Gaming & Anime',
    cursorUrl: '/assets/cursors/halo_sword.png',
    pointerUrl: '/assets/cursors/halo_sword_pointer.png',
    hotspot: [0, 0],
    pointerHotspot: [0, 0],
    previewImage: '/assets/aistudio/Halo_Energy_Sword_Cursor--cursor--SweezyCursors_8d5744aa.png',
    description: 'Plasma-charged Covenant dual energy blade with electric blue corona.'
  },
  {
    id: 'cs2-knife',
    name: 'CS2 Butterfly Knife Fade',
    category: 'Gaming & Anime',
    cursorUrl: '/assets/cursors/cs2_knife.png',
    pointerUrl: '/assets/cursors/cs2_knife.png',
    hotspot: [0, 0],
    previewImage: '/assets/aistudio/Counter-Strike_2_Butterfly_Knife_Fade_Cursor--cursor--SweezyCursors_22c7f8d1.png',
    description: 'Rainbow spectrum gradient balisong curved combat knife.'
  },
  {
    id: 'megumi-flame',
    name: 'Megumi Blue Flame',
    category: 'Gaming & Anime',
    cursorUrl: '/assets/cursors/megumi_flame.png',
    pointerUrl: '/assets/cursors/megumi_flame_pointer.png',
    hotspot: [0, 0],
    pointerHotspot: [10, 0],
    previewImage: '/assets/aistudio/Jujutsu_Kaisen_Megumi_Blue_Flame_Animated_Cursor--cursor--SweezyCursors_ba6acbd9.png',
    description: 'Jujutsu Kaisen cursed energy cyan flame spear with mystic flame hand.'
  },
  {
    id: 'marvel-cursor',
    name: 'Marvel Cinematic Cursor',
    category: 'Gaming & Anime',
    cursorUrl: '/assets/cursors/marvel.png',
    pointerUrl: '/assets/cursors/marvel_pointer.png',
    hotspot: [0, 0],
    pointerHotspot: [10, 0],
    previewImage: '/assets/aistudio/Marvel_Intro_Animated_Cursor--cursor--SweezyCursors_ded80267.png',
    description: 'Comic panel amber-gold superhero cursor with dynamic pointer.'
  },
  {
    id: 'columbina-arrow',
    name: 'Columbina Wing Arrow',
    category: 'Gaming & Anime',
    cursorUrl: '/assets/cursors/columbina.png',
    pointerUrl: '/assets/cursors/columbina.png',
    hotspot: [0, 0],
    previewImage: '/assets/aistudio/Genshin_Impact_Columbina___Wing_Arrow_Animated_Cursor--cursor--SweezyCursors_423f3a1f.png',
    description: 'Genshin Fatui Harbinger feathered celestial wing arrow.'
  },
  {
    id: 'roblox-gun',
    name: 'Roblox Tactical Gun Reticle',
    category: 'Gaming & Anime',
    cursorUrl: '/assets/cursors/roblox_gun.png',
    pointerUrl: '/assets/cursors/roblox_gun.png',
    hotspot: [16, 16],
    previewImage: '/assets/aistudio/Roblox_Classic_Default_Gun_Cursor--cursor--SweezyCursors_22923917.png',
    description: 'Classic circular cyan crosshair targeting reticle.'
  },
  {
    id: 'infamous-dagger',
    name: 'inFAMOUS Neon Dagger',
    category: 'Gaming & Anime',
    cursorUrl: '/assets/cursors/infamous.png',
    pointerUrl: '/assets/cursors/infamous.png',
    hotspot: [0, 0],
    previewImage: '/assets/aistudio/INfamous_Abigail_Walker_Cursor--cursor--SweezyCursors_66af82c7.png',
    description: 'Abigail Walker neon conduit blazing magenta dagger.'
  },

  {
    id: 'crosshair-laser',
    name: 'Tactical Crosshair Laser',
    category: 'Tactical',
    cursorUrl: 'reticle',
    hotspot: [16, 16],
    previewImage: '',
    description: 'HUD holographic laser reticle with spinning target lock brackets.'
  },
  {
    id: 'tactical-dot',
    name: 'Precision Laser Dot',
    category: 'Tactical',
    cursorUrl: 'reticle',
    hotspot: [16, 16],
    previewImage: '',
    description: 'Cyan laser collimator point with pulsing target acquisition ring.'
  },
  {
    id: 'sniper-scope',
    name: 'Sniper Reticle Scope',
    category: 'Tactical',
    cursorUrl: 'reticle',
    hotspot: [16, 16],
    previewImage: '',
    description: 'Long-range Mil-Dot sniper glass reticle with range-finder markers.'
  },
  {
    id: 'default',
    name: 'Standard Mil-Spec Cursor',
    category: 'Special Forces',
    cursorUrl: 'default',
    hotspot: [0, 0],
    previewImage: '',
    description: 'Default operating system mouse cursor.'
  }
];

export const DEFAULT_MILESTONE_CHOICES: MilestoneRewardChoice[] = [
  // 7-Day Choices
  {
    id: 'choice-7-cursor',
    milestoneDay: 7,
    type: 'CUSTOM_CURSOR',
    title: 'Custom Cursor: Solo Leveling Shadow Monarch',
    description: 'Equip the exclusive dark obsidian shadow dagger and purple monarch flame hand pointer across the site.',
    rewardValue: 'solo-leveling',
    previewImage: '/assets/aistudio/Solo_Leveling_Shadow_Arrow___Monarch_Hand_Animated_Cursor--cursor--SweezyCursors_493f92f5.png'
  },
  {
    id: 'choice-7-namecard',
    milestoneDay: 7,
    type: 'NAMECARD',
    title: 'Custom Namecard Banner',
    description: 'Equip an exclusive animated or aesthetic namecard theme (e.g. Changli: Blazing Vermilion Phoenix).',
    rewardValue: 'Changli: Blazing Vermilion Phoenix'
  },
  {
    id: 'choice-7-frame',
    milestoneDay: 7,
    type: 'AVATAR_FRAME',
    title: 'Specialist Diamond Avatar Frame',
    description: 'Equip the glowing Specialist Diamond border around your tactical operator avatar.',
    rewardValue: 'Specialist Diamond'
  },
  {
    id: 'choice-7-cash',
    milestoneDay: 7,
    type: 'CASH_POINTS',
    title: 'Treasury Cash & Points Jackpot',
    description: 'Claim $5,000,000 cash bonus + 50 Promotion Points disbursed to your career ledger.',
    rewardValue: '$5,000,000 + 50 Pts',
    cashAmount: 5000000,
    promotionPoints: 50
  },
  {
    id: 'choice-7-title',
    milestoneDay: 7,
    type: 'TITLE',
    title: 'Commendation Title: "Ironclad Vanguard"',
    description: 'Display an official prestigious title above your rank on your dossier and roster profile.',
    rewardValue: 'Ironclad Vanguard'
  },
  // 30-Day Choices
  {
    id: 'choice-30-cursor',
    milestoneDay: 30,
    type: 'CUSTOM_CURSOR',
    title: 'Custom Cursor: Halo Energy Sword',
    description: 'Equip the legendary plasma dual energy blade with electric blue corona across all pages.',
    rewardValue: 'halo-sword',
    previewImage: '/assets/aistudio/Halo_Energy_Sword_Cursor--cursor--SweezyCursors_8d5744aa.png'
  },
  {
    id: 'choice-30-namecard',
    milestoneDay: 30,
    type: 'NAMECARD',
    title: 'Supreme Archon Namecard Banner',
    description: 'Equip the Ultra Prestige "Raiden Shogun: Electro Eternity" namecard banner.',
    rewardValue: 'Raiden Shogun: Electro Eternity'
  },
  {
    id: 'choice-30-frame',
    milestoneDay: 30,
    type: 'AVATAR_FRAME',
    title: 'Supreme Gold Aureole Frame',
    description: 'Equip the highest echelon Supreme Gold Aureole border with radiant golden aura.',
    rewardValue: 'Supreme Gold Aureole'
  },
  {
    id: 'choice-30-cash',
    milestoneDay: 30,
    type: 'CASH_POINTS',
    title: 'Supreme Monthly Treasury Jackpot',
    description: 'Disburse $25,000,000 cash bonus + 200 Promotion Points to your career balance.',
    rewardValue: '$25,000,000 + 200 Pts',
    cashAmount: 25000000,
    promotionPoints: 200
  },
  {
    id: 'choice-30-title',
    milestoneDay: 30,
    type: 'TITLE',
    title: 'Supreme Commendation Title: "Grand Marshal of the Citadel"',
    description: 'Endow your dossier with the highest 30-day active duty title in CIT2 Special Forces history.',
    rewardValue: 'Grand Marshal of the Citadel'
  }
];

// Social Media (Media)
export interface SocialComment {
  id: string;
  authorName: string;
  authorCid: string;
  authorRank: string;
  authorAvatar: string;
  authorFrame?: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface SocialPost {
  id: string;
  authorName: string;
  authorCid: string;
  authorRank: string;
  authorAvatar: string;
  authorFrame?: string;
  authorNameStyle?: string;
  content: string;
  hashtags: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timestamp: string;
  likes: number;
  reposts: number;
  comments: SocialComment[];
  isLikedByMe?: boolean;
  isRepostedByMe?: boolean;
}

export interface DirectMessage {
  id: string;
  senderCid: string;
  senderName: string;
  receiverCid: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// Account Linking Portal
export interface AccountLinkRequest {
  id: string;
  username: string;
  submittedBy?: string;
  accountName?: string;
  inGameName: string;
  inGameCid: string;
  ingameRank: string;
  f5ScreenshotUrl: string;
  submissionDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  adminNote?: string;
}

// Recruitment Portal
export interface RecruitmentApplication {
  id: string;
  applicantName: string;
  /** Website account username of the applicant (set when submitted while signed in). */
  accountName?: string;
  discordTag: string;
  age: number;
  playtimeHours: number;
  lawExperience: string;
  rulesAccepted: boolean;
  date: string;
  status: 'Pending Review' | 'Accepted' | 'Denied';
  reviewerNotes?: string;
}

// Forgot Password Request
export interface ForgotPasswordRequest {
  id: string;
  accountName: string;
  emailOrContact: string;
  reasonExplanation: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Resolved';
  adminResponse?: string;
}

// Admin Events & Multipliers
export type MultiplierEventType = 
  | '1X Financial Payouts'
  | '2X Financial Payouts'
  | '3X Financial Payouts'
  | '4X Financial Payouts'
  | '2X Promotion Points'
  | '3X Promotion Points'
  | '4X Promotion Points'
  | 'Special Patrol Week';

export interface AdminEvent {
  id: string;
  title: string;
  multiplierType: MultiplierEventType;
  multiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  announcement: string;
}

// Daily Login Rewards with Cash, Promotion Points, or Custom options
export interface DailyLoginReward {
  day: number;
  cashAmount: number;
  promotionPoints: number;
  label: string;
  icon: string;
  rewardType?: 'MONEY' | 'POINTS' | 'CUSTOM';
  customTitle?: string;
  avatarFrame?: string;
  namecard?: string;
}

export interface PendingLoginRewardClaim {
  id: string;
  operatorName: string;
  operatorCid: string;
  day: number;
  cashAmount: number;
  promotionPoints: number;
  claimedAt: string;
  status: 'Pending Payout' | 'Paid Out';
}

// Birthday Gift Gifting
export interface BirthdayGift {
  id: string;
  senderName: string;
  receiverName: string;
  receiverCid: string;
  giftType: 'CASH' | 'PROMOTION_POINTS';
  amount: number;
  wishMessage: string;
  date: string;
}

// Promotion Request Submission (Saves extra points)
export interface PromotionRequest {
  id: string;
  operatorName: string;
  operatorCid: string;
  currentRank: string;
  targetRank: string;
  targetRankLevel: number;
  pointsCost: number;
  remainingPoints: number;
  currentPoints: number;
  submissionDate: string;
  status: 'Pending' | 'Approved' | 'Denied' | 'Rejected';
  notes?: string;
  squadOrGroup?: string;
  evidenceProofUrl?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export const INITIAL_PROMOTION_REQUESTS: PromotionRequest[] = [];

// Skin and Vehicle Shader Catalog Interface
export interface USSFAssetItem {
  id: string;
  type: 'SKIN' | 'VEHICLE_SHADER';
  title: string;
  codeOrId: string;
  variantCount?: number;
  imageUrl: string;
  description: string;
  category: 'Infantry' | 'Special Forces' | 'Command' | 'Vehicle';
}

export const INITIAL_SKINS_AND_SHADERS: USSFAssetItem[] = [
  {
    id: 'skin-39',
    type: 'SKIN',
    title: 'Skin ID 39 (Standard Elite Special Forces)',
    codeOrId: 'Skin ID 39',
    variantCount: 4,
    imageUrl: '/src/assets/images/special_forces_unit_1790346782492.jpg',
    description: 'Primary Special Forces combat fatigue uniform with 4 tactical variants: Urban CQB, Desert Camouflage, Night Infiltration, and Tactical Recon.',
    category: 'Special Forces'
  },
  {
    id: 'skin-164',
    type: 'SKIN',
    title: 'Skin ID 164 (Tactical Bouncer SpecOps)',
    codeOrId: 'Skin ID 164',
    variantCount: 2,
    imageUrl: '/src/assets/images/military_leader_training_1790341999734.jpg',
    description: 'Heavy armor tactical assault uniform with reinforced plate carrier and ballistic helmet.',
    category: 'Infantry'
  },
  {
    id: 'skin-285',
    type: 'SKIN',
    title: 'Skin ID 285 (SWAT Tactical Commander)',
    codeOrId: 'Skin ID 285',
    variantCount: 3,
    imageUrl: '/src/assets/images/hero_night_raid_1790347363090.jpg',
    description: 'High Command tactical dress uniform with beret and radio comms harness.',
    category: 'Command'
  },
  {
    id: 'skin-287',
    type: 'SKIN',
    title: 'Skin ID 287 (Army Desert Recon)',
    codeOrId: 'Skin ID 287',
    variantCount: 2,
    imageUrl: '/src/assets/images/hero_tactical_desert_1790341915780.jpg',
    description: 'Desert digital camouflage long-range patrol uniform.',
    category: 'Special Forces'
  },
  {
    id: 'shader-sultan',
    type: 'VEHICLE_SHADER',
    title: 'Sultan Tactical Police Shader',
    codeOrId: 'Sultan Shader #01',
    variantCount: 1,
    imageUrl: '/src/assets/images/hero_morning_patrol_1790422704024.jpg',
    description: 'High-speed interceptor livery featuring high-visibility reflective battenburg and USSF law group seal.',
    category: 'Vehicle'
  },
  {
    id: 'shader-hydra',
    type: 'VEHICLE_SHADER',
    title: 'Hydra Fighter Air Defense Shader',
    codeOrId: 'Hydra Shader #04',
    variantCount: 1,
    imageUrl: '/src/assets/images/combined_arms_assault_1790348050560.jpg',
    description: 'Matte stealth grey air superiority shader with low-observable USSF roundel.',
    category: 'Vehicle'
  },
  {
    id: 'shader-hummer',
    type: 'VEHICLE_SHADER',
    title: 'Patriot 50-Cal Gun-Truck Shader',
    codeOrId: 'Patriot Shader #02',
    variantCount: 1,
    imageUrl: '/src/assets/images/hero_tactical_desert_1790341915780.jpg',
    description: 'Desert sand armored gun-truck livery with reinforced bull-bars and thermal searchlights.',
    category: 'Vehicle'
  }
];

// Personal Squad Group Chat Interface
export interface SquadGroupMessage {
  id: string;
  senderCid: string;
  senderName: string;
  senderRank: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
}

export interface SquadGroupMember {
  cid: string;
  name: string;
  rank: string;
  avatarUrl: string;
  joinedAt: string; // ISO string: member can ONLY see messages timestamped >= joinedAt!
  role: 'LEADER' | 'OPERATOR';
}

export interface SquadGroupRequest {
  cid: string;
  name: string;
  rank: string;
  avatarUrl: string;
  requestedAt: string;
}

export interface SquadGroupChat {
  id: string;
  name: string;
  tag: string;
  description: string;
  creatorCid: string;
  creatorName: string;
  createdAt: string;
  isPrivate: boolean;
  members: SquadGroupMember[];
  pendingRequests: SquadGroupRequest[];
  messages: SquadGroupMessage[];
}

export const INITIAL_SQUAD_GROUPS: SquadGroupChat[] = [];

// Admin & Leader Tactical Studio Feature Planning
export interface StudioFeaturePlan {
  id: string;
  title: string;
  domain: 'Operations' | 'Law Enforcement' | 'Treasury' | 'Squad Comms' | 'CIT2 Tech';
  priority: 'DEFCON 1 (High)' | 'DEFCON 2 (Medium)' | 'Routine';
  status: 'PROPOSED' | 'UNDER_REVIEW' | 'IN_DEVELOPMENT' | 'DEPLOYED';
  proposerName: string;
  proposerRank: string;
  description: string;
  votesSupport: number;
  votesRevision: number;
  votedMembers: string[];
  createdAt: string;
  notes: {
    author: string;
    text: string;
    time: string;
  }[];
}

export const INITIAL_STUDIO_PLANS: StudioFeaturePlan[] = [
  {
    id: 'plan-1',
    title: 'CIT2 Live Roster & Radar Satellite Link Integration',
    domain: 'CIT2 Tech',
    priority: 'DEFCON 1 (High)',
    status: 'IN_DEVELOPMENT',
    proposerName: 'Saykel',
    proposerRank: 'Commander',
    description: 'Embed forum live status indicators and real-time map displaying USSF operators on CIT2 with auto-ping telemetry.',
    votesSupport: 8,
    votesRevision: 0,
    votedMembers: ['SF-001', 'SF-002', 'SF-004'],
    createdAt: '2026-09-25',
    notes: [
      { author: 'High Command', text: 'Approved by High Command. Implement with auto-refresh timer.', time: '2026-09-25 15:30' }
    ]
  },
  {
    id: 'plan-2',
    title: 'Special Appointed Roles (Promotion, Finance, Recovery Managers)',
    domain: 'Operations',
    priority: 'DEFCON 1 (High)',
    status: 'IN_DEVELOPMENT',
    proposerName: 'High Command',
    proposerRank: 'High Commander',
    description: 'Designate specialized authority roles given by Admin with custom glowing badges in roster, dossier, and member profiles.',
    votesSupport: 11,
    votesRevision: 0,
    votedMembers: ['SF-001', 'SF-003', 'SF-005'],
    createdAt: '2026-09-26',
    notes: [
      { author: 'Command Staff', text: 'Crucial for delegating daily tasks so leaders can handle their respective areas.', time: '2026-09-26 11:20' }
    ]
  },
  {
    id: 'plan-3',
    title: 'Squad Personal Comms with Isolated Historical Visibility',
    domain: 'Squad Comms',
    priority: 'DEFCON 2 (Medium)',
    status: 'UNDER_REVIEW',
    proposerName: 'Senior Command',
    proposerRank: 'Senior Commander',
    description: 'Allow operators to form tactical groups where only approved members can chat, and newcomers only see messages sent after joining.',
    votesSupport: 7,
    votesRevision: 1,
    votedMembers: ['SF-003', 'SF-004'],
    createdAt: '2026-09-26',
    notes: [
      { author: 'Patrol Staff', text: 'Great for patrol planning without leaking previous tactical communications.', time: '2026-09-26 14:10' }
    ]
  }
];

// Official Group Organization Specs (Level 4)
export const USSF_GROUP_INFO = {
  name: 'Special Forces',
  shortName: 'USSF',
  level: 'L4',
  founder: 'HCMD-OneManArmy#USSF',
  coFounder: 'HCMD-Meliodas#USSF',
  commander: 'SCMD-Caminade#USSF',
  leaders: 'SCMD-Caminade#USSF, SLT-Kamado#USSF',
  activeSince: '2019-06-30',
  tagUsage: 'RANK-Name#USSF',
  commandCenters: 'N/A',
  skinsAvailable: ['39', '164', '267', '285', '286', '287', '266', '1017', '1016', '1007', '1057'],
  carShadersAvailable: ['Sultan', 'Burrito', 'Banshee', 'Hydra', 'Hummer'],
  motto: "May God Have Mercy Upon Our Enemies Cause We Won't",
  organizationColor: 'R: 0 G: 0 B: 0',
  hexColor: '#000000',
  alliance: 'None',
  type: 'Law Enforcement Police Force Group (CIT2 Law Group)',
  doctrinalMissions: [
    'Unconventional Warfare',
    'Foreign Internal Defense',
    'Direct Action',
    'Counter-Insurgency',
    'Special Reconnaissance',
    'Counter-Terrorism',
    'Information Operations',
    'Counterproliferation of Weapons of Mass Destruction (WMD)',
    'Security Force Assistance'
  ],
  otherDuties: [
    'Combat Search and Rescue (CSAR)',
    'Counter-Narcotics',
    'Hostage Rescue',
    'Humanitarian Assistance',
    'Humanitarian Demining',
    'Peacekeeping',
    'Psychological Operations',
    'APB & Felon Manhunts'
  ],
  acceptanceRate: '10% Selection Pass Rate',
  operatingTheaters: 'Los Santos & Las Venturas (Ground, Sea, Air)'
};

// Official Admin Account: Kamado
export const KAMADO_ADMIN_ACCOUNT: USSFMember = {
  id: 'admin-kamado',
  cid: 'SF-001',
  name: 'Kamado',
  accountName: 'Kamado',
  callsign: 'SLT-Kamado#USSF',
  rank: 'High Commander',
  rankLevel: 20,
  rankCategory: 'High Command',
  division: 'USSF High Command Leadership',
  joinedDate: '2019-06-30',
  status: 'Active Duty',
  presenceStatus: 'Online',
  isOnlineCit: true,
  promotionPoints: 5500,
  totalPayout: 150000000,
  arrestCount: 4820,
  patrolHours: 420,
  playtimeHours: 1250,
  country: 'San Andreas',
  age: 26,
  birthday: 'March 15',
  serviceRibbons: ['Founding High Commander', 'Supreme Medal of Honor', 'Distinguished Service Cross', 'Tactical Operations Ribbon'],
  avatarUrl: '/src/assets/images/military_leader_training_1790341999734.jpg',
  avatarFrame: 'Supreme Gold Aureole',
  namecard: 'Crimson Apex Seal',
  nameStyle: 'crimson-apex',
  bio: 'High Commander & Group Leader of Special Forces [USSF]. Directing strategic tactical operations, personnel management, and CIT2 law enforcement.',
  signature: "May God Have Mercy Upon Our Enemies Cause We Won't",
  customCursor: 'solo-leveling',
  isMember: true,
  isAdmin: true,
  isOwner: true,
  isApplicant: false,
  specialRoles: ['Administrator', 'Promotion Manager', 'Financial Manager', 'Account Recovery Manager']
};

// 20 Official USSF Ranks Definition
export const USSF_RANKS: RankDefinition[] = [
  { level: 20, name: 'High Commander', order: 0, requiredDays: 365, requiredPoints: 5500, badgeColor: '#e11d48', unlockedFrame: 'Supreme Gold Aureole', unlockedNamecard: 'Crimson Apex Seal', category: 'High Command', description: 'Founder and Supreme Commander of United States Special Forces. Direct strategic leadership.' },
  { level: 19, name: 'Senior Commander', order: 10, requiredDays: 320, requiredPoints: 4600, badgeColor: '#f43f5e', unlockedFrame: 'Supreme Gold Aureole', unlockedNamecard: 'Obsidian Commander', category: 'High Command', description: 'Senior executive authority overseeing group discipline, high command decisions, and treasury.' },
  { level: 18, name: 'Commander', order: 20, requiredDays: 260, requiredPoints: 3800, badgeColor: '#fb7185', unlockedFrame: 'Vice Commander Ruby', unlockedNamecard: 'Valor Citadel', category: 'High Command', description: 'Executive field commander directing multi-squad tactical patrols and APB operations.' },
  { level: 17, name: 'Vice Commander', order: 30, requiredDays: 210, requiredPoints: 3100, badgeColor: '#f59e0b', unlockedFrame: 'Vice Commander Ruby', unlockedNamecard: 'Valor Citadel', category: 'High Command', description: 'Second-in-command operational authority assisting high commanders in administration.' },
  { level: 16, name: 'Lieutenant Commander', order: 40, requiredDays: 170, requiredPoints: 2500, badgeColor: '#eab308', unlockedFrame: 'Golden Star Officer', unlockedNamecard: 'Desert Recon', category: 'High Command', description: 'Commissioned senior officer coordinating inter-departmental units and tactical teams.' },
  { level: 15, name: 'Honorable', order: 50, requiredDays: 0, requiredPoints: 0, badgeColor: '#ec4899', unlockedFrame: 'Honorable Rose Gold', unlockedNamecard: 'Valor Citadel', category: 'Honorary Distinction', description: 'Special Honor - Awarded by High Command appointment only. Cannot be claimed via points.' },
  { level: 14, name: 'Captain', order: 60, requiredDays: 140, requiredPoints: 2000, badgeColor: '#38bdf8', unlockedFrame: 'Cobalt Shield', unlockedNamecard: 'Airborne Wings', category: 'Field Command', description: 'Field leader managing patrol squads and coordinated city checkpoints.' },
  { level: 13, name: 'Major', order: 70, requiredDays: 120, requiredPoints: 1650, badgeColor: '#0ea5e9', unlockedFrame: 'Cyan Tactical', unlockedNamecard: 'Night Vision Grid', category: 'Field Command', description: 'Senior staff officer supervising tactical doctrine and squad deployment.' },
  { level: 12, name: 'Lieutenant', order: 80, requiredDays: 100, requiredPoints: 1350, badgeColor: '#0284c7', unlockedFrame: 'Navy Officer Ring', unlockedNamecard: 'San Andreas Border', category: 'Field Command', description: 'Tactical front-line officer commanding strike teams and rapid response vehicles.' },
  { level: 11, name: 'Second Lieutenant', order: 90, requiredDays: 80, requiredPoints: 1100, badgeColor: '#10b981', unlockedFrame: 'Emerald Chevrons', unlockedNamecard: 'Urban CQB', category: 'Field Command', description: 'Newly commissioned tactical officer leading reconnaissance and pursuit details.' },
  { level: 10, name: 'Brigade Laftaru', order: 100, requiredDays: 0, requiredPoints: 0, badgeColor: '#14b8a6', unlockedFrame: 'Bronze Triple Chevron', unlockedNamecard: 'Swamp Infiltration', category: 'Honorary Distinction', description: 'Special Honor - Awarded by High Command appointment only. Cannot be claimed via points.' },
  { level: 9, name: 'Command Sergeant Major', order: 110, requiredDays: 65, requiredPoints: 900, badgeColor: '#059669', unlockedFrame: 'Forest Camo Border', unlockedNamecard: 'Swamp Infiltration', category: 'Special Operator', description: 'Senior non-commissioned officer advising commanders on squad morale and combat readiness.' },
  { level: 8, name: 'Sergeant Major', order: 120, requiredDays: 50, requiredPoints: 700, badgeColor: '#06b6d4', unlockedFrame: 'Steel Quad Bar', unlockedNamecard: 'Ballistic Plate', category: 'Special Operator', description: 'Principal NCO leader authorized to host and lead official group patrols and training.' },
  { level: 7, name: 'First Major', order: 130, requiredDays: 40, requiredPoints: 550, badgeColor: '#6366f1', unlockedFrame: 'Bronze Triple Chevron', unlockedNamecard: 'Radio Tower', category: 'Field Command', description: 'Commissioned Group Leader rank (First Major+). Senior tactical specialist authorized to lead squad operations, review field dispatches, and evaluate promotion submissions.' },
  { level: 6, name: 'Staff Sergeant', order: 140, requiredDays: 30, requiredPoints: 400, badgeColor: '#8b5cf6', unlockedFrame: 'Double Chevron', unlockedNamecard: 'Patrol Division', category: 'Special Operator', description: 'Experienced operator mentoring junior personnel and leading perimeter sweeps.' },
  { level: 5, name: 'Sergeant First Class', order: 150, requiredDays: 21, requiredPoints: 250, badgeColor: '#a855f7', unlockedFrame: 'Single Gold Chevron', unlockedNamecard: 'Highway Interdiction', category: 'Special Operator', description: 'Core tactical operator proven in sustained urban combat and felony arrests.' },
  { level: 4, name: 'Specialist', order: 160, requiredDays: 14, requiredPoints: 150, badgeColor: '#d946ef', unlockedFrame: 'Specialist Diamond', unlockedNamecard: 'Marksman', category: 'Regular Member', description: 'Technical specialist operating heavy vehicles, weapons, and tactical gear.' },
  { level: 3, name: 'Private First Class', order: 170, requiredDays: 7, requiredPoints: 75, badgeColor: '#ec4899', unlockedFrame: 'PFC Incline', unlockedNamecard: 'Tactical Trainee', category: 'Regular Member', description: 'Proven junior soldier who has completed initial trial duties and field training.' },
  { level: 2, name: 'Private', order: 180, requiredDays: 3, requiredPoints: 30, badgeColor: '#71717a', unlockedFrame: 'Recruit Ring', unlockedNamecard: 'CIT2 Law Enforcer', category: 'Regular Member', description: 'Active duty patrolman participating in squad operations and law enforcement.' },
  { level: 1, name: 'Recruit', order: 190, requiredDays: 0, requiredPoints: 0, badgeColor: '#27272a', unlockedFrame: 'Standard Issue Border', unlockedNamecard: 'Basic Issue', category: 'Regular Member', description: 'Newly enlisted recruit undergoing probation and law procedure orientation.' }
];

// Exact Realistic Financial Tasks with Quantity Multiplier support for Combat & Tactical
export const REALISTIC_REWARD_CATALOG: RewardItem[] = [
  // 1. Arrest Points (Daily - Claim once per day) - Exact Official Special Forces Schedule
  { id: 'rew-ap-1', category: 'Arrest Points', title: '5,000 Arrest Points', payoutAmount: 750000, frequency: 'DAILY', description: 'Show F5 scores or Group Scores and unedited phone clock (B+Clock). Daily claim only.' },
  { id: 'rew-ap-2', category: 'Arrest Points', title: '10,000 Arrest Points', payoutAmount: 2250000, frequency: 'DAILY', description: 'Show F5 scores or Group Scores and unedited phone clock. Daily claim only.' },
  { id: 'rew-ap-3', category: 'Arrest Points', title: '20,000 Arrest Points', payoutAmount: 4500000, frequency: 'DAILY', description: 'Show F5 scores or Group Scores and unedited phone clock. Daily claim only.' },
  { id: 'rew-ap-4', category: 'Arrest Points', title: '30,000 Arrest Points', payoutAmount: 7500000, frequency: 'DAILY', description: 'Show F5 scores or Group Scores and unedited phone clock. Daily claim only.' },
  { id: 'rew-ap-5', category: 'Arrest Points', title: '40,000 Arrest Points', payoutAmount: 12000000, frequency: 'DAILY', description: 'Show F5 scores or Group Scores and unedited phone clock. Daily claim only.' },
  { id: 'rew-ap-6', category: 'Arrest Points', title: '60,000 Arrest Points', payoutAmount: 25000000, frequency: 'DAILY', description: 'Show F5 scores or Group Scores and unedited phone clock. Daily claim only.' },
  { id: 'rew-ap-7', category: 'Arrest Points', title: '85,000 Arrest Points', payoutAmount: 38000000, frequency: 'DAILY', description: 'Show F5 scores or Group Scores and unedited phone clock. Daily claim only.' },
  { id: 'rew-ap-8', category: 'Arrest Points', title: '100,000 Arrest Points', payoutAmount: 50000000, frequency: 'DAILY', description: 'Show F5 scores or Group Scores and unedited phone clock. Daily claim only.' },

  // 2. Patrol & Training (Weekly - Claim once per week)
  { id: 'rew-pt-1', category: 'Patrol & Training', title: 'Participate in a Patrol / Training', payoutAmount: 500000, frequency: 'WEEKLY', description: 'Provide verified event screenshot proof and phone clock.' },
  { id: 'rew-pt-2', category: 'Patrol & Training', title: 'Host a Quality Patrol / Training (SGM+)', payoutAmount: 1000000, frequency: 'WEEKLY', description: 'Must be Sergeant Major rank or higher. Provide start/end log and proof.' },
  { id: 'rew-pt-3', category: 'Patrol & Training', title: 'Participate in 3 Patrols / Trainings (Weekly)', payoutAmount: 2000000, frequency: 'WEEKLY', description: 'Weekly milestone: 3 verified sessions. Resets each Monday.' },
  { id: 'rew-pt-4', category: 'Patrol & Training', title: 'Host 3 Quality Patrols / Trainings (Weekly)', payoutAmount: 5000000, frequency: 'WEEKLY', description: 'Weekly host milestone: 3 quality sessions led. Resets each Monday.' },
  { id: 'rew-pt-5', category: 'Patrol & Training', title: 'Participate in 5 Patrols / Trainings (Weekly)', payoutAmount: 5000000, frequency: 'WEEKLY', description: 'Weekly elite milestone: 5 verified patrol sessions.' },
  { id: 'rew-pt-6', category: 'Patrol & Training', title: 'Host 5 Quality Patrols / Trainings (Weekly)', payoutAmount: 7000000, frequency: 'WEEKLY', description: 'Weekly commander milestone: 5 quality sessions hosted. Maximum weekly allowance.' },

  // 3. Combat & Tactical (Can claim MULTIPLE times in a day with numeric quantity multiplier!)
  { id: 'rew-ct-1', category: 'Combat & Tactical', title: 'Arrest any criminal with Bounty Blip', payoutAmount: 1000000, frequency: 'MULTI_DAILY', allowQuantity: true, description: 'Show bounty blip on map and successful arrest. Enter quantity to multiply reward payout.' },
  { id: 'rew-ct-2', category: 'Combat & Tactical', title: 'Kill & Arrest any APB', payoutAmount: 2000000, frequency: 'MULTI_DAILY', allowQuantity: true, description: 'Show APB notification/clearing proof. Enter quantity to multiply reward payout.' },
  { id: 'rew-ct-3', category: 'Combat & Tactical', title: '4 Kill Arrests at one AR / CE', payoutAmount: 700000, frequency: 'MULTI_DAILY', allowQuantity: true, description: 'Show event log showing 4 kill arrests during single AR/CE. Enter count to multiply.' },
  { id: 'rew-ct-4', category: 'Combat & Tactical', title: 'Deal 2,000+ Damage in one AR / CE', payoutAmount: 800000, frequency: 'MULTI_DAILY', allowQuantity: true, description: 'Show damage pool proof and phone clock. Enter quantity to multiply reward payout.' },

  // 4. Daily & Specialist Tasks (Daily reset)
  { id: 'rew-dt-1', category: 'Daily & Specialist Tasks', title: 'Top Cop of the Day', payoutAmount: 2000000, frequency: 'DAILY', description: 'Show daily reset and phone clock. Must have been in USSF when earned.' },
  { id: 'rew-dt-2', category: 'Daily & Specialist Tasks', title: 'Top Bomb Disposal of the Day', payoutAmount: 2000000, frequency: 'DAILY', description: 'Show daily reset scoreboard and phone clock.' },
  { id: 'rew-dt-3', category: 'Daily & Specialist Tasks', title: 'Top Detective of the Day', payoutAmount: 2000000, frequency: 'DAILY', description: 'Show daily reset detective ranking and phone clock.' },
  { id: 'rew-dt-4', category: 'Daily & Specialist Tasks', title: 'Defuse 30 Bombs', payoutAmount: 2000000, frequency: 'DAILY', description: 'Show verified bomb disposal proof and phone clock.' },
  { id: 'rew-dt-5', category: 'Daily & Specialist Tasks', title: 'Defuse 50 Bombs', payoutAmount: 2000000, frequency: 'DAILY', description: 'Show verified bomb disposal proof and phone clock.' },
  { id: 'rew-dt-6', category: 'Daily & Specialist Tasks', title: 'Solve 15 Detective Cases', payoutAmount: 2000000, frequency: 'DAILY', description: 'Show detective cases solved log and phone clock.' },
  { id: 'rew-dt-7', category: 'Daily & Specialist Tasks', title: 'Solve 30 Detective Cases', payoutAmount: 2000000, frequency: 'DAILY', description: 'Show detective cases solved log and phone clock.' },

  // 5. Promotions & Achievements (Once only / Monthly)
  { id: 'rew-pa-1', category: 'Promotions & Achievements', title: 'Junior Commissioned Officer (JCM) Ranks', payoutAmount: 3000000, frequency: 'ONCE_ONLY', description: 'Claimable once in service. Promotion evidence required.' },
  { id: 'rew-pa-2', category: 'Promotions & Achievements', title: 'Regular Commissioned Officer (RCM) Ranks', payoutAmount: 7000000, frequency: 'ONCE_ONLY', description: 'Claimable once in service. Promotion evidence required.' },
  { id: 'rew-pa-3', category: 'Promotions & Achievements', title: 'Senior Commissioned Officer (SCM) Ranks', payoutAmount: 15000000, frequency: 'ONCE_ONLY', description: 'Claimable once in service. Promotion evidence required.' },
  { id: 'rew-pa-4', category: 'Promotions & Achievements', title: 'Major Promotion (SFC to FMJR)', payoutAmount: 30000000, frequency: 'ONCE_ONLY', description: 'Milestone promotion award: Sergeant First Class to Field Major. Once only.' },
  { id: 'rew-pa-5', category: 'Promotions & Achievements', title: 'Command Promotion (CSM to VCMD)', payoutAmount: 50000000, frequency: 'ONCE_ONLY', description: 'Elite promotion: Command Sergeant Major to Vice Commander. Once only.' },
  { id: 'rew-pa-6', category: 'Promotions & Achievements', title: 'Special Operator of the Month', payoutAmount: 80000000, frequency: 'MONTHLY', description: 'Awarded to top monthly operator. Resets on 1st of every month.' }
];

export const INITIAL_MEMBERS: USSFMember[] = [KAMADO_ADMIN_ACCOUNT];

export const INITIAL_FIELD_REPORTS: FieldReport[] = [];

export const INITIAL_CLAIMS: FinancialClaim[] = [];

// 102 Comprehensive Achievement Definitions (All 0 Progress, None Unlocked on Clean Release)
export const INITIAL_ACHIEVEMENTS: USSFAchievement[] = [];

export const INITIAL_SOCIAL_POSTS: SocialPost[] = [];

export const INITIAL_DMS: DirectMessage[] = [];

export const INITIAL_ACCOUNT_LINK_REQUESTS: AccountLinkRequest[] = [];

export const INITIAL_RECRUITMENT_APPLICATIONS: RecruitmentApplication[] = [];

export const INITIAL_FORGOT_PW_REQUESTS: ForgotPasswordRequest[] = [];

export const INITIAL_ADMIN_EVENTS: AdminEvent[] = [
  {
    id: 'evt-1',
    title: 'STANDARD OPERATIONS: 1X TREASURY PAYOUTS',
    multiplierType: '1X Financial Payouts',
    multiplier: 1,
    startDate: '2026-09-29',
    endDate: '2026-12-31',
    isActive: true,
    announcement: 'Official USSF standard financial payouts active. Claim verified arrest points and patrol milestones.'
  }
];

// 7-day Login Rewards with both Cash AND Promotion Points
export const DAILY_LOGIN_REWARDS_7: DailyLoginReward[] = [
  { day: 1, cashAmount: 500000, promotionPoints: 25, label: '$500,000 Cash + 25 Points', icon: 'DollarSign' },
  { day: 2, cashAmount: 1000000, promotionPoints: 50, label: '$1,000,000 Cash + 50 Points', icon: 'DollarSign' },
  { day: 3, cashAmount: 1500000, promotionPoints: 75, label: '$1,500,000 Cash + 75 Points', icon: 'DollarSign' },
  { day: 4, cashAmount: 2000000, promotionPoints: 100, label: '$2,000,000 Cash + 100 Points', icon: 'DollarSign' },
  { day: 5, cashAmount: 3000000, promotionPoints: 150, label: '$3,000,000 Cash + 150 Points', icon: 'DollarSign' },
  { day: 6, cashAmount: 5000000, promotionPoints: 200, label: '$5,000,000 Cash + 200 Points', icon: 'DollarSign' },
  { day: 7, cashAmount: 10000000, promotionPoints: 500, label: '$10,000,000 Cash + 500 Points', icon: 'DollarSign' }
];

// Full 30-day Monthly Login Rewards with Cash AND Promotion Points
export const DAILY_LOGIN_REWARDS_30: DailyLoginReward[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const isGrandDay = day % 7 === 0 || day === 30;
  const cash = isGrandDay ? (day === 30 ? 25000000 : day * 1000000) : day * 300000;
  const points = isGrandDay ? (day === 30 ? 1000 : day * 25) : day * 10;
  return {
    day,
    cashAmount: cash,
    promotionPoints: points,
    label: `$${(cash / 1000000).toFixed(1)}M + ${points} Pts`,
    icon: isGrandDay ? 'Award' : 'DollarSign'
  };
});

export const INITIAL_PENDING_LOGIN_CLAIMS: PendingLoginRewardClaim[] = [];

export const INITIAL_REWARD_CATALOG = REALISTIC_REWARD_CATALOG;

export interface CommandNewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export const COMMAND_NEWS: CommandNewsItem[] = [
  {
    id: 'news-1',
    title: 'OPERATION ARMORED INTERDICTION SUCCESSFUL',
    content: 'All available CIT2 special forces patrol groups deployed to San Fierro docks. APB target secured within 14 minutes with zero operative injuries.',
    date: '2026-09-26',
    author: 'HIGH COMMAND DISPATCH'
  },
  {
    id: 'news-2',
    title: 'WEEKLY TREASURY DISBURSEMENTS AUTHORIZED',
    content: 'High Command has issued over $120,000,000 in combat bounties, 100K arrest point claims, and weekly quality patrol hosting bonuses.',
    date: '2026-09-25',
    author: 'FINANCIAL DIRECTORATE'
  },
  {
    id: 'news-3',
    title: '150+ MULTILINGUAL COMMUNICATIONS NETWORK ONLINE',
    content: 'All international tactical operators can now utilize localized command interfaces across 150+ recognized world languages.',
    date: '2026-09-24',
    author: 'COMMUNICATIONS CORPS'
  }
];

export const INITIAL_BIRTHDAY_GIFTS: BirthdayGift[] = [];
