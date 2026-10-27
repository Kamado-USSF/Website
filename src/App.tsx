import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { USSFHeader, USSFView } from './components/USSFHeader';
import { HeroSection } from './components/HeroSection';
import { USSFHomeView } from './components/USSFHomeView';
import { USSFOperationsView } from './components/USSFOperationsView';
import { USSFRosterView } from './components/USSFRosterView';
import { USSFFinancialView } from './components/USSFFinancialView';
import { USSFCareerView } from './components/USSFCareerView';
import { USSFSocialView } from './components/USSFSocialView';
import { USSFRecruitmentView } from './components/USSFRecruitmentView';
import { USSFAdminView } from './components/USSFAdminView';
import { USSFProfileView } from './components/USSFProfileView';
import { USSFGroupInfoView } from './components/USSFGroupInfoView';
import { USSFBirthdayView } from './components/USSFBirthdayView';
import { USSFSettingsView } from './components/USSFSettingsView';
import { VideoSection } from './components/VideoSection';
import { USSFLeadersView } from './components/USSFLeadersView';
import { PersonalGroupChat } from './components/PersonalGroupChat';
import { SkinsShadersView } from './components/SkinsShadersView';
import { USSFIntelAIView } from './components/USSFIntelAIView';
import { TacticalLoadingScreen } from './components/TacticalLoadingScreen';
import { USSFReportModal } from './components/USSFReportModal';
import { USSFClaimModal } from './components/USSFClaimModal';
import { PHPExportModal } from './components/PHPExportModal';
import { AuthModal } from './components/AuthModal';
import { TutorialModal } from './components/TutorialModal';
import { LanguageModal } from './components/LanguageModal';
import { NotificationDrawer, TacticalNotification } from './components/NotificationDrawer';
import { Footer } from './components/Footer';
import { CustomCursorManager } from './components/CustomCursorManager';
import { 
  INITIAL_MEMBERS, 
  INITIAL_FIELD_REPORTS, 
  INITIAL_CLAIMS, 
  INITIAL_REWARD_CATALOG,
  INITIAL_SOCIAL_POSTS,
  INITIAL_DMS,
  INITIAL_ACCOUNT_LINK_REQUESTS,
  INITIAL_RECRUITMENT_APPLICATIONS,
  INITIAL_FORGOT_PW_REQUESTS,
  INITIAL_ADMIN_EVENTS,
  DAILY_LOGIN_REWARDS_7,
  INITIAL_PENDING_LOGIN_CLAIMS,
  INITIAL_BIRTHDAY_GIFTS,
  INITIAL_PROMOTION_REQUESTS,
  INITIAL_SQUAD_GROUPS,
  USSF_GROUP_INFO,
  USSF_RANKS,
  DiscordPresenceStatus,
  PromotionHistoryEntry,
  PromotionRequest,
  USSFMember,
  SpecialRole,
  FieldReport,
  FinancialClaim,
  RewardItem,
  SocialPost,
  SocialComment,
  DirectMessage,
  AccountLinkRequest,
  RecruitmentApplication,
  ForgotPasswordRequest,
  AdminEvent,
  DailyLoginReward,
  PendingLoginRewardClaim,
  BirthdayGift,
  SquadGroupChat,
  INITIAL_ACHIEVEMENTS,
  USSFAchievement,
  INITIAL_SKINS_AND_SHADERS,
  USSFAssetItem,
  MilestoneRewardChoice,
  DEFAULT_MILESTONE_CHOICES,
  KAMADO_ADMIN_ACCOUNT
} from './data/ussfData';
import { Check, ShieldAlert, UserPlus, Lock } from 'lucide-react';
import { tacticalAudio } from './utils/audioSynth';
import { applyLanguageToDocument } from './utils/translations';
import { validatePromotionEligibility } from './utils/promotionValidator';
import { api, setUnauthorizedHandler } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState<USSFView>('home');
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('ussf_language') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    applyLanguageToDocument(currentLanguage);
  }, [currentLanguage]);

  const [activeTheme, setActiveTheme] = useState<'dark' | 'nvg' | 'day'>('dark');

  // Authenticated Member State - Starts completely unauthenticated for clean visitor experience
  const [currentUser, setCurrentUser] = useState<USSFMember | null>(() => {
    try {
      const saved = localStorage.getItem('ussf_logged_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return null; // Visitors must not be automatically authenticated
  });

  // Server-verified administrator session (HttpOnly cookie). Only the server decides
  // whether this browser holds a valid admin session; this flag just tracks its state.
  const [adminSessionActive, setAdminSessionActive] = useState<boolean>(false);

  // Modals & Drawers
  const [isPhpExportOpen, setIsPhpExportOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [preselectedReward, setPreselectedReward] = useState<RewardItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core Data States - Filter out any legacy testing accounts and clean production state
  const [members, setMembers] = useState<USSFMember[]>(() => {
    try {
      const saved = localStorage.getItem('ussf_members');
      if (saved) {
        const parsed: USSFMember[] = JSON.parse(saved);
        const filtered = parsed.filter(m => {
          const lowerName = (m.name || '').toLowerCase();
          const lowerId = (m.id || '').toLowerCase();
          const lowerCid = (m.cid || '').toLowerCase();
          const isTest = lowerName.includes('test') || lowerId.includes('test') || lowerCid.includes('test') || lowerName.includes('dummy') || lowerName.includes('sample') || Boolean(m.isApplicant);
          return !isTest;
        });
        return filtered;
      }
    } catch {}
    return INITIAL_MEMBERS;
  });

  const [fieldReports, setFieldReports] = useState<FieldReport[]>([]);
  const [claims, setClaims] = useState<FinancialClaim[]>([]);
  const [rewardCatalog] = useState<RewardItem[]>(INITIAL_REWARD_CATALOG);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(INITIAL_SOCIAL_POSTS);
  const [dms, setDms] = useState<DirectMessage[]>(INITIAL_DMS);
  const [linkRequests, setLinkRequests] = useState<AccountLinkRequest[]>([]);
  const [applications, setApplications] = useState<RecruitmentApplication[]>([]);
  const [forgotPwRequests, setForgotPwRequests] = useState<ForgotPasswordRequest[]>([]);
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>(INITIAL_ADMIN_EVENTS);
  const [loginRewards, setLoginRewards] = useState<DailyLoginReward[]>(DAILY_LOGIN_REWARDS_7);
  const [pendingLoginClaims, setPendingLoginClaims] = useState<PendingLoginRewardClaim[]>([]);
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [groupInfo, setGroupInfo] = useState(USSF_GROUP_INFO);
  const [preselectedQuantity, setPreselectedQuantity] = useState<number>(1);
  const [birthdayGifts, setBirthdayGifts] = useState<BirthdayGift[]>([]);
  const [birthdayTargetMember, setBirthdayTargetMember] = useState<USSFMember | null>(null);
  const [squadGroups, setSquadGroups] = useState<SquadGroupChat[]>(() => {
    const saved = localStorage.getItem('ussf_squad_groups');
    return saved ? JSON.parse(saved) : INITIAL_SQUAD_GROUPS;
  });
  const [achievements, setAchievements] = useState<USSFAchievement[]>(() => {
    try {
      const saved = localStorage.getItem('ussf_achievements');
      return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  });
  const [customAssets, setCustomAssets] = useState<USSFAssetItem[]>(INITIAL_SKINS_AND_SHADERS);
  const [isLoadingScreen, setIsLoadingScreen] = useState<boolean>(true);

  // Tactical Notifications
  const [notifications, setNotifications] = useState<TacticalNotification[]>([
    {
      id: 'notif-1',
      type: 'bonus',
      title: 'DAILY LOGIN BONUS READY',
      message: 'Day 01 reward ($500,000 Cash + 25 Points) is available to claim in your Financial rewards portal.',
      timestamp: 'Just now',
      isRead: false
    },
    {
      id: 'notif-2',
      type: 'social',
      title: 'COMMAND DISPATCH NOTICE',
      message: 'Weekly group patrols active across San Andreas. Report to your squad leader.',
      timestamp: '1h ago',
      isRead: false
    }
  ]);

  // First-time tutorial trigger unless disabled in Settings
  useEffect(() => {
    // Purge any legacy test requests, mock claims, or test accounts
    try {
      localStorage.removeItem('ussf_claims');
      localStorage.removeItem('ussf_promotion_requests');
      localStorage.removeItem('ussf_applications');
      localStorage.removeItem('ussf_link_requests');
      localStorage.removeItem('ussf_test_members');
      
      const savedMembers = localStorage.getItem('ussf_members');
      let cleaned: USSFMember[] = [];
      if (savedMembers) {
        const parsed: USSFMember[] = JSON.parse(savedMembers);
        cleaned = parsed.filter(m => {
          const lowerName = (m.name || '').toLowerCase();
          const lowerId = (m.id || '').toLowerCase();
          const lowerCid = (m.cid || '').toLowerCase();
          return !lowerName.includes('test') && !lowerId.includes('test') && !lowerCid.includes('test') && !lowerName.includes('dummy') && !lowerName.includes('sample') && !m.isApplicant;
        });
      }
      if (!cleaned.some(m => (m.name || '').toLowerCase() === 'kamado' || m.cid === 'SF-001')) {
        cleaned.unshift(KAMADO_ADMIN_ACCOUNT);
      }
      localStorage.setItem('ussf_members', JSON.stringify(cleaned));

      // Administrator credentials live server-side only: the admin account is never
      // seeded into browser storage with a password. Sign-in goes through POST /api/auth/login.
      try {
        const registered: any[] = JSON.parse(localStorage.getItem('ussf_registered_accounts') || '[]');
        const cleaned = registered.filter((a: any) => (a.username || '').toLowerCase() !== 'kamado');
        if (cleaned.length !== registered.length) {
          localStorage.setItem('ussf_registered_accounts', JSON.stringify(cleaned));
        }
        const memberPass: Record<string, string> = JSON.parse(localStorage.getItem('ussf_member_passwords') || '{}');
        let passChanged = false;
        for (const key of ['kamado', 'admin-kamado', 'sf-001']) {
          if (key in memberPass) {
            delete memberPass[key];
            passChanged = true;
          }
        }
        if (passChanged) localStorage.setItem('ussf_member_passwords', JSON.stringify(memberPass));
      } catch {}
    } catch {}

    const tourDisabled = localStorage.getItem('ussf_tutorial_disabled');
    const hasSeenTour = localStorage.getItem('ussf_tutorial_seen');
    if (!tourDisabled && !hasSeenTour) {
      const timer = setTimeout(() => {
        setIsTutorialOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Synchronize state with authoritative backend and poll for multi-user changes
  const clientClaimsAdmin = Boolean(currentUser && currentUser.isMember && !currentUser.isApplicant && (
    currentUser.isOwner || currentUser.isAdmin || (currentUser.specialRoles?.length || 0) > 0 ||
    currentUser.rankCategory === 'High Command' || (currentUser.rankLevel || 0) >= 16
  ));
  // Restore the server admin session on load and react to expired/rejected sessions.
  useEffect(() => {
    setUnauthorizedHandler(() => setAdminSessionActive(false));
    let isMounted = true;
    api.getSession().then(session => {
      if (isMounted && session.authenticated) setAdminSessionActive(true);
    });
    return () => {
      isMounted = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const syncState = async () => {
      try {
        let state;
        if (clientClaimsAdmin && adminSessionActive) {
          // Admin state requires a valid server session cookie; a 401 here fires the
          // unauthorized handler, which flips adminSessionActive back to public reads.
          state = await api.getAdminState();
        } else {
          state = await api.getState();
        }
        if (!isMounted) return;
        if (state.members) setMembers(state.members);
        if (clientClaimsAdmin && state.claims) setClaims(state.claims);
        if (clientClaimsAdmin && state.fieldReports) setFieldReports(state.fieldReports);
        if (clientClaimsAdmin && state.promotionRequests) setPromotionRequests(state.promotionRequests);
        if (clientClaimsAdmin && state.applications) setApplications(state.applications);
        if (clientClaimsAdmin && state.linkRequests) setLinkRequests(state.linkRequests);
        if (clientClaimsAdmin && state.forgotPwRequests) setForgotPwRequests(state.forgotPwRequests);
        if (state.adminEvents) setAdminEvents(state.adminEvents);
        if (state.loginRewards) setLoginRewards(state.loginRewards);
        if (clientClaimsAdmin && state.pendingLoginClaims) setPendingLoginClaims(state.pendingLoginClaims);
        if (state.groupInfo) setGroupInfo(state.groupInfo);
        if (clientClaimsAdmin && state.birthdayGifts) setBirthdayGifts(state.birthdayGifts);
        if (clientClaimsAdmin && state.squadGroups) setSquadGroups(state.squadGroups);
        if (state.achievements) setAchievements(state.achievements);
        if (state.customAssets) setCustomAssets(state.customAssets);

        // Keep current user updated with server data while preserving selected presence
        if (clientClaimsAdmin) setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const fresh = (state.members || []).find(m => m.id === prevUser.id || m.cid === prevUser.cid);
          if (fresh) {
            const preservedPresence = (prevUser.presenceStatus === 'DND' || prevUser.presenceStatus === 'Idle')
              ? prevUser.presenceStatus
              : (fresh.presenceStatus || 'Online');
            return { ...fresh, presenceStatus: preservedPresence };
          }
          return prevUser;
        });
      } catch (err) {
        // Silently tolerate transient network delays
      }
    };

    syncState();
    const pollInterval = setInterval(syncState, 4000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [currentUser?.id, clientClaimsAdmin, adminSessionActive]);

  // Save members and current user to localStorage for fallback
  useEffect(() => {
    localStorage.setItem('ussf_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ussf_logged_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ussf_logged_user');
    }
  }, [currentUser]);

  // Strict Admin Authorization Check
  // Civilian accounts, unapproved applicants, or non-members CANNOT access Admin power!
  // Requires explicit isOwner or isAdmin flag, or authorized High Command officer rank (Tier 16+)
  const isUserAdmin = Boolean(
    currentUser &&
    currentUser.isMember &&
    !currentUser.isApplicant &&
    currentUser.status !== 'Applicant' &&
    (
      currentUser.isOwner ||
      currentUser.isAdmin ||
      (currentUser.specialRoles && currentUser.specialRoles.length > 0) ||
      currentUser.rankCategory === 'High Command' ||
      (currentUser.rankLevel && currentUser.rankLevel >= 16)
    )
  );

  // Founder Bootstrap is available ONLY when zero administrators or owners exist in the system
  const isBootstrapAvailable = !members.some(m => m.isAdmin || m.isOwner);

  const handleOwnerBootstrap = (bootstrapData: {
    ownerName: string;
    cid: string;
    passphrase: string;
    password: string;
  }): { success: boolean; message: string } => {
    const requiredPassphrase = import.meta.env.VITE_BOOTSTRAP_SECRET || 'USSF-COMMAND-ALPHA-2026-BOOTSTRAP';
    if (bootstrapData.passphrase !== requiredPassphrase) {
      return { success: false, message: 'Invalid Master Bootstrap Passphrase. Access Denied.' };
    }
    if (!bootstrapData.ownerName || !bootstrapData.cid || !bootstrapData.password) {
      return { success: false, message: 'Owner name, CID, and password are required.' };
    }

    const founderRank = USSF_RANKS[0]; // High Commander (Level 20)
    const founder: USSFMember = {
      id: `founder-${Date.now()}`,
      cid: bootstrapData.cid,
      name: bootstrapData.ownerName,
      accountName: bootstrapData.ownerName,
      callsign: 'High-Commander',
      rank: founderRank.name,
      rankLevel: founderRank.level,
      rankCategory: 'High Command',
      division: 'USSF High Command Leadership',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active Duty',
      presenceStatus: 'Online',
      promotionPoints: 0,
      totalPayout: 0,
      arrestCount: 0,
      patrolHours: 0,
      playtimeHours: 0,
      serviceRibbons: ['Founder Medal of Honor'],
      avatarUrl: '/src/assets/images/military_leader_training_1790341999734.jpg',
      avatarFrame: 'Supreme Gold Aureole',
      namecard: 'USSF High Commander',
      nameStyle: 'gold-glow',
      bio: 'Legitimate founding High Commander & System Owner.',
      signature: 'Command Authority Verified.',
      customCursor: 'crosshair-laser',
      linkedInGame: true,
      isOwner: true,
      isAdmin: true,
      isMember: true,
      isApplicant: false
    };

    // Store in registered accounts with password
    try {
      const accounts = JSON.parse(localStorage.getItem('ussf_registered_accounts') || '[]');
      accounts.push({
        id: founder.id,
        username: bootstrapData.ownerName.toLowerCase(),
        password: bootstrapData.password,
        user: founder
      });
      localStorage.setItem('ussf_registered_accounts', JSON.stringify(accounts));
    } catch {}

    api.saveMember(founder).catch(err => console.warn('Failed to save founder to server:', err));
    const updated = [founder, ...members];
    setMembers(updated);
    setCurrentUser(founder);
    localStorage.setItem('ussf_members', JSON.stringify(updated));
    localStorage.setItem('ussf_logged_user', JSON.stringify(founder));
    localStorage.setItem('ussf_bootstrap_completed', 'true');
    showToast(`FOUNDER PROTOCOL EXECUTED: ${founder.name} registered as High Commander & Owner.`);
    return { success: true, message: 'Founder bootstrap successfully executed.' };
  };

  // 7 & 30 Days Login Milestone Reward Choices State (Preserved across sessions)
  const [milestoneChoices, setMilestoneChoices] = useState<MilestoneRewardChoice[]>(() => {
    try {
      const saved = localStorage.getItem('ussf_milestone_choices');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MILESTONE_CHOICES;
  });

  const handleUpdateMilestoneChoices = (choices: MilestoneRewardChoice[]) => {
    setMilestoneChoices(choices);
    try {
      localStorage.setItem('ussf_milestone_choices', JSON.stringify(choices));
    } catch (e) {}
    showToast('Milestone reward configurations saved.');
  };

  // Authoritative presence updater - retains DND and Idle preferences without automatic resets
  const handleUpdatePresence = async (status: DiscordPresenceStatus) => {
    if (!currentUser) return;
    try {
      const updatedUser: USSFMember = { 
        ...currentUser, 
        presenceStatus: status, 
        isOnlineCit: status !== 'Offline' 
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('ussf_logged_user', JSON.stringify(updatedUser));
      setMembers(prev => prev.map(m => m.id === currentUser.id ? updatedUser : m));
      await api.updatePresence(currentUser.id, status);
      await api.updateMember(currentUser.id, { presenceStatus: status, isOnlineCit: status !== 'Offline' });
      showToast(`Presence status persisted: ${status}`);
    } catch (err: any) {
      showToast(`Presence updated: ${status}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleNavigate = (view: USSFView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleThemeToggle = () => {
    if (activeTheme === 'dark') setActiveTheme('nvg');
    else if (activeTheme === 'nvg') setActiveTheme('day');
    else setActiveTheme('dark');
  };

  const handleLogin = (member: USSFMember, keepLoggedIn: boolean) => {
    setCurrentUser(member);
    // Administrator sign-in already happened against POST /api/auth/login; confirm the
    // server session so admin-state reads start immediately.
    if (member.isAdmin || member.isOwner) {
      api.getSession()
        .then(session => setAdminSessionActive(session.authenticated))
        .catch(() => setAdminSessionActive(false));
    }
    // Only add to official roster if they are an approved active member
    if (member.isMember && !member.isApplicant && member.status === 'Active Duty') {
      if (!members.find(m => m.id === member.id)) {
        setMembers([member, ...members]);
      }
    }
    if (!member.isMember || member.isApplicant) {
      showToast(`Logged in as Civilian Account: ${member.name}. Enlistment required for USSF membership.`);
      setCurrentView('recruitment');
    } else {
      showToast(`Authenticated: Welcome, Operator ${member.name}`);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      const offlineProfile: USSFMember = { ...currentUser, presenceStatus: 'Offline', isOnlineCit: false };
      setMembers(prev => prev.map(m => m.id === offlineProfile.id ? offlineProfile : m));
    }
    // Clear the HttpOnly admin session cookie server-side (best effort).
    api.logoutAdmin();
    setAdminSessionActive(false);
    setCurrentUser(null);
    showToast('Logged out of Special Forces Command Network.');
  };

  const handleUpdateProfile = async (updated: Partial<USSFMember>) => {
    if (!currentUser) return;
    const newProfile = { ...currentUser, ...updated };
    setCurrentUser(newProfile);
    localStorage.setItem('ussf_logged_user', JSON.stringify(newProfile));
    try {
      const saved = await api.updateMember(currentUser.id, updated);
      const newMembers = members.map(m => m.id === saved.id ? saved : m);
      setMembers(newMembers);
      localStorage.setItem('ussf_members', JSON.stringify(newMembers));
      showToast('Profile credentials, namecard, and customizations saved to authoritative database.');
    } catch (err: any) {
      showToast(`Warning: Failed to save to server: ${err?.message || 'Network error'}`);
    }
  };

  // Promotion points rule:
  // Host patrol or training gives 20 points
  // Participate in patrol or training gives 10 points
  const handleCreateReport = async (newReport: FieldReport) => {
    if (!currentUser || !currentUser.isMember || currentUser.isApplicant) {
      showToast('ACCESS DENIED: Only verified active USSF members may file tactical field reports.');
      return;
    }

    try {
      const savedReport = await api.submitReport(newReport);
      setFieldReports(prev => [savedReport, ...prev.filter(r => r.id !== savedReport.id)]);

      const hostPts = 20;
      const participantPts = 10;

      if (currentUser) {
        const isHost = savedReport.hostName?.toLowerCase() === currentUser.name?.toLowerCase() ||
                       savedReport.hostCid === currentUser.cid;
        const isParticipant = savedReport.participants.some(p => 
          p.toLowerCase().includes(currentUser.name?.toLowerCase()) || 
          (currentUser.cid && p.includes(currentUser.cid))
        );

        const ptsEarned = isHost ? hostPts : (isParticipant ? participantPts : 0);
        if (ptsEarned > 0) {
          const updatedUser = {
            ...currentUser,
            promotionPoints: (currentUser.promotionPoints || 0) + ptsEarned,
            patrolHours: (currentUser.patrolHours || 0) + savedReport.durationHours
          };
          setCurrentUser(updatedUser);
          localStorage.setItem('ussf_logged_user', JSON.stringify(updatedUser));
          await api.updateMember(currentUser.id, {
            promotionPoints: updatedUser.promotionPoints,
            patrolHours: updatedUser.patrolHours
          });
          setMembers(prev => prev.map(m => m.id === updatedUser.id ? updatedUser : m));
          showToast(`Published Report: ${savedReport.title} (+${ptsEarned} Points awarded for ${isHost ? 'Hosting' : 'Participating'}!)`);
          return;
        }
      }

      showToast(`Published Field Report: ${savedReport.title} (Host awarded +20 pts, Participants +10 pts)`);
    } catch (err: any) {
      showToast(`Error publishing field report: ${err?.message || 'Failed to save'}`);
    }
  };

  // Financial tasks claims saved to authoritative backend
  const handleCreateClaim = async (newClaim: FinancialClaim) => {
    if (!currentUser || !currentUser.isMember || currentUser.isApplicant) {
      showToast('ACCESS DENIED: Only verified active USSF members can submit financial claims.');
      return;
    }

    try {
      const savedClaim = await api.submitClaim(newClaim);
      setClaims(prev => [savedClaim, ...prev.filter(c => c.id !== savedClaim.id)]);
      showToast(`Financial claim submitted to High Command Admin Queue: $${savedClaim.amount.toLocaleString()} (${savedClaim.rewardTitle})`);
    } catch (err: any) {
      showToast(`Error transmitting financial claim: ${err?.message || 'Failed to save'}`);
      throw err;
    }
  };

  const handleReviewClaim = async (id: string, status: 'Approved' | 'Rejected', note?: string, rejectionReason?: string) => {
    try {
      const reviewer = currentUser?.callsign || currentUser?.name || 'Administrator';
      const updatedClaim = await api.reviewClaim(id, status, note, reviewer, rejectionReason);
      setClaims(prev => prev.map(c => c.id === id ? updatedClaim : c));

      // Refresh authoritative state so claimant member profile and financial payouts update immediately
      const state = await api.getState();
      if (state.members) setMembers(state.members);
      if (state.claims) setClaims(state.claims);
      if (currentUser) {
        const fresh = (state.members || []).find(m => m.id === currentUser.id || m.cid === currentUser.cid);
        if (fresh) {
          setCurrentUser({ ...fresh, presenceStatus: currentUser.presenceStatus });
          localStorage.setItem('ussf_logged_user', JSON.stringify(fresh));
        }
      }

      showToast(`Financial claim ${status.toLowerCase()}: ${updatedClaim.rewardTitle} ($${updatedClaim.amount.toLocaleString()})`);
    } catch (err: any) {
      showToast(`Error reviewing claim: ${err?.message || 'Failed to update'}`);
      throw err;
    }
  };

  const handleUpdateAchievements = (newAch: USSFAchievement[]) => {
    setAchievements(newAch);
    try {
      localStorage.setItem('ussf_achievements', JSON.stringify(newAch));
    } catch (e) {}
    showToast('Achievements & Commendations database synchronized.');
  };

  const handleCreateAsset = async (asset: USSFAssetItem) => {
    try {
      const savedAssets = await api.createAsset(asset);
      setCustomAssets(savedAssets);
      showToast('Asset saved to the shared armory.');
      return savedAssets;
    } catch (err: any) {
      showToast(`Error saving asset: ${err?.message || 'Request failed.'}`);
      throw err;
    }
  };

  const handleUpdateAsset = async (asset: USSFAssetItem) => {
    try {
      const savedAssets = await api.updateAsset(asset);
      setCustomAssets(savedAssets);
      showToast('Asset changes saved to the shared armory.');
      return savedAssets;
    } catch (err: any) {
      showToast(`Error updating asset: ${err?.message || 'Request failed.'}`);
      throw err;
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const savedAssets = await api.deleteAsset(id);
      setCustomAssets(savedAssets);
      showToast('Asset deleted from the shared armory.');
      return savedAssets;
    } catch (err: any) {
      showToast(`Error deleting asset: ${err?.message || 'Request failed.'}`);
      throw err;
    }
  };

  const handleAddSocialPost = (post: SocialPost) => {
    setSocialPosts([post, ...socialPosts]);
    showToast('Tactical Dispatch broadcasted to WarFeed.');
  };

  const handleAddSocialComment = (postId: string, comment: SocialComment) => {
    setSocialPosts(socialPosts.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...p.comments, comment] };
      }
      return p;
    }));
    showToast('Field reply submitted.');
  };

  const handleToggleLikePost = (postId: string) => {
    setSocialPosts(socialPosts.map(p => {
      if (p.id === postId) {
        return { ...p, likes: p.likes + 1 };
      }
      return p;
    }));
    tacticalAudio.playTacticalClick();
    showToast('WarFeed dispatch liked.');
  };

  const handleRepostPost = (postId: string) => {
    setSocialPosts(socialPosts.map(p => {
      if (p.id === postId) {
        return { ...p, reposts: p.reposts + 1 };
      }
      return p;
    }));
    tacticalAudio.playTargetLock();
    showToast('WarFeed dispatch reposted to your timeline.');
  };

  const handleSendDm = (dm: DirectMessage) => {
    setDms([dm, ...dms]);
  };

  const handleAddRecruitmentApp = async (app: RecruitmentApplication) => {
    const saved = await api.submitApplication(app);
    setApplications(prev => [saved, ...prev.filter(a => a.id !== saved.id)]);
    showToast('Enlistment application submitted to High Command and saved to authoritative database.');
  };

  const handleAddLinkRequest = async (req: AccountLinkRequest) => {
    const saved = await api.submitLinkRequest(req);
    setLinkRequests(prev => [saved, ...prev.filter(item => item.id !== saved.id)]);
    showToast('In-game account linking request sent to Admin review queue.');
  };

  const handleResolveForgotPw = (id: string, approved: boolean) => {
    setForgotPwRequests(forgotPwRequests.map(r => {
      if (r.id === id) {
        return { ...r, status: approved ? 'Approved' : 'Resolved' };
      }
      return r;
    }));
    showToast(approved ? 'Password reset token approved & issued.' : 'Request dismissed.');
  };

  const handleResolveLinkRequest = async (id: string, approved: boolean) => {
    try {
      const reviewer = currentUser?.callsign || currentUser?.name || 'Administrator';
      const status = approved ? 'Approved' : 'Rejected';
      const updated = await api.reviewLinkRequest(
        id,
        status,
        reviewer,
        approved ? undefined : 'Rejected during administrative review.'
      );
      setLinkRequests(prev => prev.map(r => (r.id === id ? (updated || r) : r)));
      showToast(`Account-link request ${status.toLowerCase()} for ${updated?.inGameName || 'operator'}.`);

      // Refresh authoritative state so roster/account linking changes are reflected after reload.
      const state = adminSessionActive ? await api.getAdminState() : await api.getState();
      if (state.members) setMembers(state.members);
      if (state.linkRequests) setLinkRequests(state.linkRequests);
    } catch (err: any) {
      showToast(`Error reviewing account-link request: ${err?.message || 'Failed to update'}`);
      throw err;
    }
  };

  // Daily Bonus claiming sends claim to Admin Section for monetary payout approval
  const handleClaimDailyBonus = () => {
    if (!currentUser || !currentUser.isMember || currentUser.isApplicant) {
      showToast('ACCESS DENIED: Daily login bonuses are available only to verified active USSF members.');
      return;
    }
    tacticalAudio.playTargetLock();

    const newClaim: PendingLoginRewardClaim = {
      id: `plc-${Date.now()}`,
      operatorName: currentUser.name,
      operatorCid: currentUser.cid,
      day: 1,
      cashAmount: 500000,
      promotionPoints: 25,
      claimedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending Payout'
    };

    setPendingLoginClaims([newClaim, ...pendingLoginClaims]);

    // Mark notification as read
    setNotifications(notifications.map(n => n.type === 'bonus' ? { ...n, isRead: true } : n));
    showToast('Day 01 Login Reward ($500,000 Cash + 25 Points) sent to Admin Section for disbursement approval!');
  };

  const handleApproveLoginClaim = (id: string) => {
    const claim = pendingLoginClaims.find(c => c.id === id);
    if (!claim) return;

    setPendingLoginClaims(pendingLoginClaims.map(c => c.id === id ? { ...c, status: 'Paid Out' } : c));

    // Credit member payout
    setMembers(members.map(m => m.cid === claim.operatorCid ? { 
      ...m, 
      totalPayout: m.totalPayout + claim.cashAmount,
      promotionPoints: m.promotionPoints + claim.promotionPoints
    } : m));
    if (currentUser && currentUser.cid === claim.operatorCid) {
      setCurrentUser({ 
        ...currentUser, 
        totalPayout: currentUser.totalPayout + claim.cashAmount,
        promotionPoints: currentUser.promotionPoints + claim.promotionPoints
      });
    }

    showToast(`Disbursed $${claim.cashAmount.toLocaleString()} Cash to ${claim.operatorName}!`);
  };

  const handleSendBirthdayGift = async (gift: BirthdayGift) => {
    try {
      const savedGift = await api.sendBirthdayGift(gift);
      setBirthdayGifts(prev => [savedGift, ...prev]);
      setMembers(members.map(m => {
        if (m.cid === gift.receiverCid) {
          return {
            ...m,
            totalPayout: gift.giftType === 'CASH' ? m.totalPayout + gift.amount : m.totalPayout
          };
        }
        return m;
      }));
      showToast(`Birthday gift sent to ${gift.receiverName}: ${gift.giftType === 'CASH' ? '$' + gift.amount.toLocaleString() : gift.amount + ' Points'}`);
    } catch (err: any) {
      showToast(`Error sending birthday gift: ${err?.message}`);
    }
  };

  const handleUpdateMemberBirthday = (memberId: string, birthdayDate: string) => {
    handleUpdateMember(memberId, { birthday: birthdayDate });
    showToast(`Operator birthday updated to ${birthdayDate}.`);
  };

  // Admin and Promotion Handlers with Authoritative Server Persistence
  const handleUpdateMember = async (memberId: string, updated: Partial<USSFMember>) => {
    try {
      const saved = await api.updateMember(memberId, updated);
      const newMembers = members.map(m => m.id === memberId ? saved : m);
      setMembers(newMembers);
      localStorage.setItem('ussf_members', JSON.stringify(newMembers));
      if (currentUser && currentUser.id === memberId) {
        const updatedCurrent = { ...currentUser, ...saved };
        setCurrentUser(updatedCurrent);
        localStorage.setItem('ussf_logged_user', JSON.stringify(updatedCurrent));
      }
      showToast('Personnel dossier updated and saved to authoritative database.');
    } catch (err: any) {
      showToast(`Error saving member: ${err?.message}`);
    }
  };

  const handlePromoteMemberNormal = (memberId: string): { success: boolean; message: string } => {
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) return { success: false, message: 'Member not found.' };

    const currentLevel = targetMember.rankLevel || 1;
    const targetLevel = currentLevel + 1;
    const targetRank = USSF_RANKS.find(r => r.level === targetLevel);
    if (!targetRank) return { success: false, message: 'Maximum rank echelon reached.' };

    const validation = validatePromotionEligibility(targetMember, targetLevel);
    if (!validation.eligible) {
      const err = `Promotion Ineligible: ${validation.incompleteReasons[0]}`;
      showToast(err);
      return { success: false, message: err };
    }

    // Deduct points cost and advance rank
    const remainingPoints = (targetMember.promotionPoints || 0) - targetRank.requiredPoints;
    const newCategory = targetRank.category || (targetLevel >= 16 ? 'High Command' : targetLevel >= 11 ? 'Field Command' : 'Special Operator');

    const newHistoryEntry: PromotionHistoryEntry = {
      id: `ph-${Date.now()}`,
      rankTitle: targetRank.name,
      rankLevel: targetLevel,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      pointsUsed: targetRank.requiredPoints,
      approvingOfficer: currentUser?.callsign || currentUser?.name || 'High Command Leadership',
      citation: `Normal Promotion: verified qualification to ${targetRank.name}`
    };

    const updates: Partial<USSFMember> = {
      rank: targetRank.name,
      rankLevel: targetLevel,
      rankCategory: newCategory as any,
      promotionPoints: remainingPoints,
      promotionHistory: [newHistoryEntry, ...(targetMember.promotionHistory || [])],
      division: targetMember.division.includes('Leader') || targetLevel < 7 ? targetMember.division : `${targetRank.name} & Tactical Leader`
    };

    api.updateMember(memberId, updates)
      .then(saved => {
        setMembers(members.map(m => m.id === memberId ? saved : m));
        if (currentUser && currentUser.id === memberId) {
          setCurrentUser(saved);
          localStorage.setItem('ussf_logged_user', JSON.stringify(saved));
        }
      })
      .catch(err => {
        showToast(`Failed to persist promotion to server: ${err?.message}`);
      });

    showToast(`Promotion approved! ${targetMember.name} commissioned to ${targetRank.name} (Tier ${targetLevel}).`);
    return { success: true, message: `Promoted to ${targetRank.name}` };
  };

  const handleUpdateMemberRoles = async (memberId: string, isAdmin: boolean, specialRoles: SpecialRole[], note?: string) => {
    try {
      const saved = await api.updateMember(memberId, { isAdmin, specialRoles });
      setMembers(members.map(m => m.id === memberId ? saved : m));
      if (currentUser && currentUser.id === memberId) {
        setCurrentUser(saved);
        localStorage.setItem('ussf_logged_user', JSON.stringify(saved));
      }
      showToast('Security roles updated and saved to authoritative database.');
    } catch (err: any) {
      showToast(`Error saving roles: ${err?.message}`);
    }
  };

  const handleUpdateMemberRank = async (memberId: string, newRank: string, newLevel: number, note?: string) => {
    const targetRankDef = USSF_RANKS.find(r => r.name === newRank || r.level === newLevel);
    const newCategory = targetRankDef?.category || (newLevel >= 16 ? 'High Command' : newLevel >= 11 ? 'Field Command' : 'Special Operator');

    const newHistoryEntry: PromotionHistoryEntry = {
      id: `ph-${Date.now()}`,
      rankTitle: newRank,
      rankLevel: newLevel,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      pointsUsed: 0,
      approvingOfficer: currentUser?.callsign || currentUser?.name || 'Administrator',
      citation: note || `Direct Administrative Commission to ${newRank}`
    };

    const targetMember = members.find(m => m.id === memberId);
    const updates: Partial<USSFMember> = {
      rank: newRank,
      rankLevel: newLevel,
      rankCategory: newCategory as any,
      promotionHistory: [newHistoryEntry, ...((targetMember && targetMember.promotionHistory) || [])],
      division: (targetMember && targetMember.division.includes('Leader')) || newLevel < 7 ? (targetMember?.division || '') : `${newRank} & Tactical Leader`
    };

    try {
      const saved = await api.updateMember(memberId, updates);
      setMembers(members.map(m => m.id === memberId ? saved : m));
      if (currentUser && currentUser.id === memberId) {
        setCurrentUser(saved);
        localStorage.setItem('ussf_logged_user', JSON.stringify(saved));
      }
      showToast(`Administrative rank updated: ${newRank} (Tier ${newLevel}) saved to server.`);
    } catch (err: any) {
      showToast(`Error updating rank: ${err?.message}`);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await api.deleteMember(memberId);
      setMembers(members.filter(m => m.id !== memberId));
      showToast('Member removed from authoritative database.');
    } catch (err: any) {
      showToast(`Error removing member: ${err?.message}`);
    }
  };

  const handleSetWebOwner = (memberId: string, password: string): { success: boolean; message: string } => {
    if (password !== 'MityaAndKazuha786') {
      return { success: false, message: 'Invalid Owner Password!' };
    }
    Promise.all(members.map(m => api.updateMember(m.id, { isOwner: m.id === memberId })))
      .then(() => {
        setMembers(members.map(m => ({ ...m, isOwner: m.id === memberId })));
      })
      .catch(err => console.warn('Error saving owner to server:', err));
    showToast('Web Owner role successfully transferred!');
    return { success: true, message: 'Web Owner updated.' };
  };

  const handleSubmitPromotionRequest = async (req: PromotionRequest) => {
    try {
      const saved = await api.submitPromotion(req);
      setPromotionRequests(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
      showToast(`Promotion request for ${req.targetRank} submitted to High Command Admin Queue.`);
    } catch (err: any) {
      showToast(`Error submitting promotion request: ${err?.message}`);
      throw err;
    }
  };

  const handleResolvePromotionRequest = async (id: string, approved: boolean, feedback?: string, rejectionReason?: string) => {
    const req = promotionRequests.find(r => r.id === id);
    if (!req) return;
    try {
      const status = approved ? 'Approved' : 'Rejected';
      const reviewer = currentUser?.callsign || currentUser?.name || 'High Command Leadership';
      await api.reviewPromotion(id, status, reviewer, feedback, rejectionReason);
      const state = await api.getState();
      setPromotionRequests(state.promotionRequests || []);
      setMembers(state.members || []);
      if (currentUser) {
        const fresh = (state.members || []).find(m => m.id === currentUser.id || m.cid === currentUser.cid);
        if (fresh) {
          setCurrentUser({ ...fresh, presenceStatus: currentUser.presenceStatus });
          localStorage.setItem('ussf_logged_user', JSON.stringify(fresh));
        }
      }
      showToast(`Promotion request for ${req.operatorName} to ${req.targetRank} ${status.toLowerCase()} and synchronized across the site.`);
    } catch (err: any) {
      showToast(`Error reviewing promotion request: ${err?.message}`);
      throw err;
    }
  };

  const handleUpdateGroupInfo = async (updated: Partial<typeof USSF_GROUP_INFO>) => {
    try {
      const saved = await api.updateGroupInfo(updated);
      setGroupInfo(saved);
      showToast('Group specifications saved and published globally.');
    } catch (err: any) {
      showToast(`Error updating group specs: ${err?.message}`);
      throw err;
    }
  };

  // Cursor CSS style depending on user preference
  const cursorClass = currentUser?.customCursor === 'crosshair-laser' 
    ? 'cursor-crosshair-laser'
    : currentUser?.customCursor === 'tactical-dot'
    ? 'cursor-tactical-dot'
    : currentUser?.customCursor === 'sniper-scope'
    ? 'cursor-sniper-scope'
    : '';

  // Theme wrapper CSS
  const themeClass = activeTheme === 'nvg' ? 'theme-nvg' : activeTheme === 'day' ? 'theme-day' : '';

  // Motion animation variants for smooth page entrance
  const pageVariants: Variants = {
    initial: {
      opacity: 0,
      y: 14,
      filter: 'blur(3px)'
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.38,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -8,
      filter: 'blur(2px)',
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  return (
    <>
      <CustomCursorManager customCursor={currentUser?.customCursor} />
      {isLoadingScreen && (
        <TacticalLoadingScreen onLoaded={() => setIsLoadingScreen(false)} />
      )}
      <div className={`relative min-h-screen bg-[#080a08] text-neutral-100 selection:bg-amber-500 selection:text-neutral-950 font-sans flex flex-col justify-between ${cursorClass} ${themeClass}`}>
      <div>
        {/* Official Header Navigation */}
        <USSFHeader
          currentView={currentView}
          onNavigate={handleNavigate}
          activePersonnelCount={members.filter(m => m.status === 'Active Duty').length}
          onOpenPhpExport={() => setIsPhpExportOpen(true)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          unreadNotificationCount={notifications.filter(n => !n.isRead).length}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          currentLanguage={currentLanguage}
          onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
          activeTheme={activeTheme}
          onThemeToggle={handleThemeToggle}
          isUserAdmin={isUserAdmin}
          onUpdatePresence={(status) => handleUpdateProfile({ presenceStatus: status, isOnlineCit: true })}
        />

        {/* DISTINCT PAGE ROUTING WITH FRAMER MOTION TRANSITIONS */}
        <main className="w-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* 1. HOMEPAGE */}
            {currentView === 'home' && (
              <motion.div
                key="home"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                {/* 5-Second Auto-Rotating Military Theaters Hero Section */}
                <HeroSection onNavigate={handleNavigate} lang={currentLanguage} />

                {/* Command Deck, Operational Readiness, Field Feed & Leadership */}
                <USSFHomeView
                  onNavigate={handleNavigate}
                  members={members}
                  fieldReports={fieldReports}
                />

                {/* Synchronized Special Forces Operational Encyclopedia */}
                <VideoSection />
              </motion.div>
            )}

            {/* 2. FIELD OPERATIONS PAGE */}
            {currentView === 'operations' && (
              <motion.div
                key="operations"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFOperationsView
                  onNavigate={handleNavigate}
                  reports={fieldReports}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                />
              </motion.div>
            )}

            {/* 3. OFFICIAL ROSTER PAGE WITH PERSONNEL DOSSIERS */}
            {currentView === 'roster' && (
              <motion.div
                key="roster"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFRosterView
                  members={members}
                  onNavigate={handleNavigate}
                  onOpenBirthdayGift={(member) => {
                    setBirthdayTargetMember(member);
                    handleNavigate('birthdays');
                  }}
                  currentUser={currentUser}
                  onUpdateMember={handleUpdateMember}
                />
              </motion.div>
            )}

            {/* 4. FINANCIAL DEPARTMENT & CREATOR REVENUE PAGE */}
            {currentView === 'financial' && (
              <motion.div
                key="financial"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFFinancialView
                  claims={claims}
                  rewardCatalog={rewardCatalog}
                  events={adminEvents}
                  currentUser={currentUser}
                  onOpenClaimModal={(reward, qty) => {
                    setPreselectedReward(reward || null);
                    setPreselectedQuantity(qty || 1);
                    setIsClaimModalOpen(true);
                  }}
                  onClaimDailyLoginReward={(claim) => {
                    setPendingLoginClaims([claim, ...pendingLoginClaims]);
                    showToast('Daily login reward claim submitted to Admin Queue!');
                  }}
                />
              </motion.div>
            )}

            {/* 5. CAREER & PROMOTIONS HIERARCHY PAGE (22 RANKS) */}
            {currentView === 'career' && (
              <motion.div
                key="career"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFCareerView
                  currentUser={currentUser}
                  members={members}
                  events={adminEvents}
                  onSubmitPromotionRequest={handleSubmitPromotionRequest}
                  promotionRequests={promotionRequests}
                  onResolvePromotionRequest={handleResolvePromotionRequest}
                />
              </motion.div>
            )}

            {/* 6. SOCIAL MEDIA PAGE (WARFEED & DIRECT MESSAGING) */}
            {currentView === 'social' && (
              <motion.div
                key="social"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFSocialView
                  currentUser={currentUser}
                  members={members}
                  posts={socialPosts}
                  dms={dms}
                  onAddPost={handleAddSocialPost}
                  onAddComment={handleAddSocialComment}
                  onSendDm={handleSendDm}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onToggleLikePost={handleToggleLikePost}
                  onRepostPost={handleRepostPost}
                />
              </motion.div>
            )}

            {/* 7. RECRUITMENT & IN-GAME ACCOUNT LINKING PORTAL */}
            {currentView === 'recruitment' && (
              <motion.div
                key="recruitment"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFRecruitmentView
                  applications={applications}
                  linkRequests={linkRequests}
                  onSubmitApplication={handleAddRecruitmentApp}
                  onSubmitLinkRequest={handleAddLinkRequest}
                />
              </motion.div>
            )}

            {/* 8. ADMIN DECK & EVENT CREATOR & PAYOUT QUEUE */}
            {currentView === 'admin' && (
              <motion.div
                key="admin"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                {isUserAdmin ? (
                  <USSFAdminView
                    currentUser={currentUser}
                    applications={applications}
                    events={adminEvents}
                    onAddEvent={(e) => {
                      setAdminEvents([e, ...adminEvents]);
                      showToast(`Activated Multiplier Campaign: ${e.title}`);
                    }}
                    forgotPwRequests={forgotPwRequests}
                    onResolveForgotPw={handleResolveForgotPw}
                    linkRequests={linkRequests}
                    onResolveLinkRequest={handleResolveLinkRequest}
                    loginRewards={loginRewards}
                    onUpdateLoginRewards={setLoginRewards}
                    members={members}
                    claims={claims}
                    onUpdateClaims={setClaims}
                    onReviewClaim={handleReviewClaim}
                    fieldReports={fieldReports}
                    onUpdateFieldReports={setFieldReports}
                    onUpdateMemberRank={handleUpdateMemberRank}
                    onPromoteMemberNormal={handlePromoteMemberNormal}
                    onUpdateMemberRoles={handleUpdateMemberRoles}
                    onDeleteMember={handleDeleteMember}
                    onSetWebOwner={handleSetWebOwner}
                    promotionRequests={promotionRequests}
                    onResolvePromotionRequest={handleResolvePromotionRequest}
                    pendingLoginClaims={pendingLoginClaims}
                    onApproveLoginClaim={handleApproveLoginClaim}
                    groupInfo={groupInfo}
                    onUpdateGroupInfo={handleUpdateGroupInfo}
                    achievements={achievements}
                    onUpdateAchievements={handleUpdateAchievements}
                    assets={customAssets}
                    onCreateAsset={handleCreateAsset}
                    onUpdateAsset={handleUpdateAsset}
                    onDeleteAsset={handleDeleteAsset}
                    milestoneChoices={milestoneChoices}
                    onUpdateMilestoneChoices={handleUpdateMilestoneChoices}
                  />
                ) : (
                  <div className="min-h-[70vh] flex items-center justify-center p-4">
                    <div className="max-w-md w-full rounded-2xl border-2 border-rose-500/80 bg-[#0d100d] p-8 text-center space-y-4 shadow-2xl">
                      <div className="h-16 w-16 rounded-full bg-rose-950/80 border-2 border-rose-500 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
                        <ShieldAlert className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-data text-rose-400 uppercase tracking-widest font-bold block">
                          SECURITY CLEARANCE RESTRICTION // ACCESS DENIED
                        </span>
                        <h2 className="text-2xl font-tactical font-black uppercase text-white">
                          HIGH COMMAND CLEARANCE REQUIRED
                        </h2>
                      </div>
                      <p className="text-xs font-sans text-neutral-300 leading-relaxed">
                        The Admin Command Deck is strictly restricted to verified United States Special Forces Leadership & High Command on CIT2.
                        {currentUser ? ` You are logged in as "${currentUser.name}" (${currentUser.rank}).` : ' You are currently not signed in.'}
                      </p>
                      <div className="pt-2 flex flex-col gap-2 font-tactical text-xs">
                        {(!currentUser || currentUser.isApplicant) && (
                          <button
                            onClick={() => handleNavigate('recruitment')}
                            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase flex items-center justify-center gap-2 cursor-pointer shadow"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>APPLY FOR USSF ENLISTMENT</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleNavigate('roster')}
                          className="w-full py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 font-bold uppercase cursor-pointer"
                        >
                          <span>RETURN TO VERIFIED ROSTER</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 9. MEMBER PROFILE WORKSTATION */}
            {currentView === 'profile' && (
              <motion.div
                key="profile"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFProfileView
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateProfile}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  activeTheme={activeTheme}
                  onThemeChange={(t) => setActiveTheme(t as any)}
                />
              </motion.div>
            )}

            {/* 10. GROUP INFORMATION SPECIFICATIONS */}
            {currentView === 'groupInfo' && (
              <motion.div
                key="groupInfo"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFGroupInfoView onNavigate={handleNavigate} />
              </motion.div>
            )}

            {/* 11. BIRTHDAY CALENDAR & GIFTING */}
            {currentView === 'birthdays' && (
              <motion.div
                key="birthdays"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFBirthdayView
                  currentUser={currentUser}
                  members={members}
                  gifts={birthdayGifts}
                  onSendGift={handleSendBirthdayGift}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  preselectedMember={birthdayTargetMember}
                  onUpdateMemberBirthday={handleUpdateMemberBirthday}
                />
              </motion.div>
            )}


            {/* 13. PREFERENCES & PRIVACY SETTINGS */}
            {currentView === 'settings' && (
              <motion.div
                key="settings"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFSettingsView
                  currentUser={currentUser}
                  activeTheme={activeTheme}
                  onThemeToggle={handleThemeToggle}
                  currentLanguage={currentLanguage}
                  onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                  onUpdateProfile={handleUpdateProfile}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              </motion.div>
            )}

            {/* 14. MISSION ENCYCLOPEDIA */}
            {currentView === 'video-reel' && (
              <motion.div
                key="video-reel"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full py-6"
              >
                <VideoSection />
              </motion.div>
            )}

            {/* 15. MILITARY FORCE LEADERS & COMMAND PHILOSOPHIES */}
            {currentView === 'leaders' && (
              <motion.div
                key="leaders"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFLeadersView
                  currentUser={currentUser}
                  members={members}
                  onUpdateMember={handleUpdateMember}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onNavigate={setCurrentView}
                  promotionRequests={promotionRequests}
                  onResolvePromotionRequest={handleResolvePromotionRequest}
                />
              </motion.div>
            )}

            {/* 17. ENCRYPTED SQUAD GROUP CHAT & PRIVATE COMMS */}
            {currentView === 'squad-chat' && (
              <motion.div
                key="squad-chat"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <PersonalGroupChat
                  currentUser={currentUser}
                  members={members}
                  groups={squadGroups}
                  onUpdateGroups={(newG) => {
                    setSquadGroups(newG);
                    localStorage.setItem('ussf_squad_groups', JSON.stringify(newG));
                  }}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              </motion.div>
            )}

            {/* 18. TACTICAL SKINS & VEHICLE SHADERS */}
            {currentView === 'skins' && (
              <motion.div
                key="skins"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <SkinsShadersView assets={customAssets} />
              </motion.div>
            )}

            {/* 19. TACTICAL COMMAND INTEL AI */}
            {currentView === 'ai-intel' && (
              <motion.div
                key="ai-intel"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <USSFIntelAIView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals & Dialogs */}
      <PHPExportModal
        isOpen={isPhpExportOpen}
        onClose={() => setIsPhpExportOpen(false)}
      />

      <USSFReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentUser={currentUser}
        onSubmitReport={handleCreateReport}
      />

      <USSFClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        currentUser={currentUser}
        onSubmitClaim={handleCreateClaim}
        rewardCatalog={rewardCatalog}
        preselectedReward={preselectedReward}
        preselectedQuantity={preselectedQuantity}
        activeMultiplier={
          (() => {
            const activeEvt = adminEvents.find(e => 
              e.isActive && (
                e.multiplierType === '2X Financial Payouts' || 
                e.multiplierType === '3X Financial Payouts' || 
                e.multiplierType === '4X Financial Payouts' ||
                (e.multiplierType && typeof e.multiplierType === 'string' && e.multiplierType.toLowerCase().includes('financial')) ||
                (e.title && typeof e.title === 'string' && e.title.toLowerCase().includes('financial')) ||
                (e.multiplier && e.multiplier > 1 && !e.multiplierType?.toLowerCase().includes('promotion'))
              )
            );
            return activeEvt ? (activeEvt.multiplier || (activeEvt.multiplierType?.includes('4X') ? 4 : activeEvt.multiplierType?.includes('3X') ? 3 : 2)) : 1;
          })()
        }
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        members={members}
        isBootstrapAvailable={isBootstrapAvailable}
        onOwnerBootstrap={handleOwnerBootstrap}
        onSubmitForgotPw={(req) => {
          setForgotPwRequests([req, ...forgotPwRequests]);
          showToast('Password recovery request transmitted to Admin queue.');
        }}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onNavigate={handleNavigate}
      />

      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={(code) => {
          setCurrentLanguage(code);
          showToast(`International Language updated: ${code.toUpperCase()}`);
        }}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications(notifications.map(n => ({ ...n, isRead: true })));
          showToast('All notifications marked as read.');
        }}
        onClearAll={() => {
          setNotifications([]);
          showToast('Notification center cleared.');
        }}
        onClaimDailyBonus={handleClaimDailyBonus}
      />

      {/* Global Tactical Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/60 bg-neutral-900/95 px-4 py-3 text-xs font-data text-emerald-300 shadow-2xl backdrop-blur-md"
          >
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
