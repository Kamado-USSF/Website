import React, { useState } from 'react';
import { 
  Shield, Globe, ChevronDown, Crosshair, Sparkles, Volume2, 
  VolumeX, BookOpen, Moon, Sun, Bell, User, LogOut, 
  Compass, Flame, ShieldAlert, UserPlus, Link2, MessageSquare, 
  Calendar, Trophy, Settings as SettingsIcon, Radio, Crown,
  Bot, Shirt, DollarSign, Award, Users, Menu, X
} from 'lucide-react';
import { tacticalAudio } from '../utils/audioSynth';
import { ALL_150_LANGUAGES, getTranslation, applyLanguageToDocument } from '../utils/translations';
import { USSFMember, USSF_GROUP_INFO, DiscordPresenceStatus } from '../data/ussfData';
import { USSFLogo } from './USSFLogo';

export type USSFView = 
  | 'home' 
  | 'operations' 
  | 'roster' 
  | 'financial' 
  | 'career' 
  | 'social' 
  | 'groupInfo'
  | 'birthdays'
  | 'recruitment' 
  | 'admin' 
  | 'profile' 
  | 'settings'
  | 'video-reel'
  | 'leaders'
  | 'squad-chat'
  | 'skins'
  | 'ai-intel';

interface USSFHeaderProps {
  currentView: USSFView;
  onNavigate: (view: USSFView) => void;
  activePersonnelCount?: number;
  onOpenPhpExport?: () => void;
  currentUser: USSFMember | null;
  groupInfo?: typeof USSF_GROUP_INFO;
  onOpenAuth: () => void;
  onLogout: () => void;
  unreadNotificationCount: number;
  onOpenNotifications: () => void;
  onOpenTutorial: () => void;
  currentLanguage: string;
  onOpenLanguageModal: () => void;
  activeTheme: 'dark' | 'nvg' | 'day';
  onThemeToggle: () => void;
  isUserAdmin?: boolean;
  onUpdatePresence?: (status: DiscordPresenceStatus) => void;
}

export const USSFHeader: React.FC<USSFHeaderProps> = ({
  currentView,
  onNavigate,
  activePersonnelCount = 6,
  currentUser,
  groupInfo,
  onOpenAuth,
  onLogout,
  unreadNotificationCount,
  onOpenNotifications,
  onOpenTutorial,
  currentLanguage,
  onOpenLanguageModal,
  activeTheme,
  onThemeToggle,
  isUserAdmin = false,
  onUpdatePresence
}) => {
  // Dropdown states for merged sections
  const [rosterDropdownOpen, setRosterDropdownOpen] = useState(false);
  const [opsDropdownOpen, setOpsDropdownOpen] = useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [presenceDropdownOpen, setPresenceDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const t = (key: string) => getTranslation(currentLanguage, key);

  const closeDropdowns = () => {
    setRosterDropdownOpen(false);
    setOpsDropdownOpen(false);
    setCommunityDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  const handleNav = (view: USSFView) => {
    tacticalAudio.playTacticalClick();
    onNavigate(view);
    closeDropdowns();
    setMobileMenuOpen(false);
  };

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    tacticalAudio.setMuted(nextState);
    if (!nextState) {
      tacticalAudio.playRadioSquelch();
    }
  };

  const currentLangObj = ALL_150_LANGUAGES.find(l => l.code === currentLanguage) || ALL_150_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-[#0d0f0c]/95 backdrop-blur-md">
      {/* Top Utility Bar */}
      <div className="border-b border-neutral-800/80 px-4 py-1.5 sm:px-6 lg:px-8 text-[11px] font-data text-neutral-400 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SPECIAL FORCES (USSF) · CIT2 LAW GROUP
          </span>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <span className="hidden md:inline text-neutral-300 italic">
            "{groupInfo?.motto || USSF_GROUP_INFO.motto}"
          </span>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Quick Guided Tour Button */}
          <button
            onClick={() => {
              tacticalAudio.playTacticalClick();
              onOpenTutorial();
            }}
            className="flex items-center gap-1 text-[11px] font-data text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
          >
            <Compass className="h-3 w-3" />
            <span className="hidden sm:inline">OPERATOR GUIDE</span>
          </button>

          {/* Dark / NVG / Day Mode Toggle */}
          <button
            onClick={() => {
              tacticalAudio.playTacticalClick();
              onThemeToggle();
            }}
            className="flex items-center gap-1 text-[11px] font-data text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer"
            title={`Active Theme: ${activeTheme.toUpperCase()} (Click to toggle)`}
          >
            {activeTheme === 'dark' && <Moon className="h-3 w-3 text-neutral-400" />}
            {activeTheme === 'nvg' && <Sparkles className="h-3 w-3 text-emerald-400" />}
            {activeTheme === 'day' && <Sun className="h-3 w-3 text-amber-400" />}
            <span className="uppercase text-[10px] hidden sm:inline">{activeTheme}</span>
          </button>

          {/* 150+ Language Selector Button */}
          <button
            onClick={() => {
              tacticalAudio.playTacticalClick();
              onOpenLanguageModal();
            }}
            className="flex items-center gap-1 text-neutral-300 hover:text-amber-400 transition-colors text-[11px] font-data cursor-pointer bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700"
          >
            <span>{currentLangObj.flag}</span>
            <span className="uppercase font-bold">{currentLangObj.code}</span>
            <span className="text-neutral-500 text-[10px] hidden sm:inline">({ALL_150_LANGUAGES.length}+)</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleSound}
            className="flex items-center gap-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
            title={isMuted ? 'Tactical audio is muted' : 'Audio active'}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-neutral-500" /> : <Volume2 className="h-3.5 w-3.5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Left: Brand Identification */}
        <div 
          onClick={() => handleNav('home')} 
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-neutral-900 border-2 border-neutral-700 shadow-lg group-hover:border-amber-500 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all shrink-0">
            <USSFLogo size="md" />
            <div className="absolute inset-0 rounded-full border border-dashed border-amber-500/30 animate-spin-slow pointer-events-none" />
          </div>

          <div>
            <div className="text-base sm:text-lg font-extrabold tracking-wider text-neutral-100 font-tactical group-hover:text-amber-300 transition-colors leading-none flex items-center gap-1.5">
              <span>SPECIAL FORCES</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold">USSF</span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-data text-neutral-400 tracking-widest uppercase mt-0.5 hidden xs:block">
              CIT2 LAW ENFORCEMENT & MILITARY SPECIAL OPS
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs with Dropdown Mergers */}
        <nav className="hidden xl:flex items-center gap-1 text-xs font-tactical tracking-wider">
          {/* 1. HOME */}
          <button
            onClick={() => handleNav('home')}
            className={`px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
              currentView === 'home'
                ? 'bg-neutral-800 text-neutral-100 font-bold border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t('home')}
          </button>

          {/* 2. GROUP INFO */}
          <button
            onClick={() => handleNav('groupInfo')}
            className={`px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
              currentView === 'groupInfo'
                ? 'bg-neutral-800 text-amber-400 font-bold border border-neutral-700'
                : 'text-neutral-400 hover:text-amber-300'
            }`}
          >
            {t('groupInfo')}
          </button>

          {/* 3. PATROL & TRAINING (Directly visible!) */}
          <button
            onClick={() => handleNav('operations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
              currentView === 'operations'
                ? 'bg-neutral-800 text-amber-300 font-bold border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'text-neutral-400 hover:text-amber-300'
            }`}
            title="Patrol & Training Logs, Attendance, and Hosting Proofs"
          >
            <Radio className="h-3.5 w-3.5 text-amber-400" />
            <span>PATROL & TRAINING</span>
          </button>

          {/* 4. MERGED DROPDOWN: ROSTER & LEADERS */}
          <div 
            className="relative"
            onMouseEnter={() => setRosterDropdownOpen(true)}
            onMouseLeave={() => setRosterDropdownOpen(false)}
          >
            <button
              onClick={() => setRosterDropdownOpen(!rosterDropdownOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
                currentView === 'roster' || currentView === 'leaders'
                  ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-neutral-400" />
              <span>ROSTER & LEADERS</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${rosterDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>

            {rosterDropdownOpen && (
              <div className="absolute left-0 top-full pt-1 w-52 z-50 animate-in fade-in">
                <div className="rounded-xl border border-neutral-800 bg-[#0d100d] p-1.5 shadow-2xl space-y-1">
                  <button
                    onClick={() => handleNav('roster')}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer ${
                      currentView === 'roster' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                    }`}
                  >
                    <span>RANK AND ROSTER</span>
                    <span className="text-[10px] font-mono opacity-80">20 Ranks</span>
                  </button>
                  <button
                    onClick={() => handleNav('leaders')}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer ${
                      currentView === 'leaders' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-300 hover:bg-neutral-900 hover:text-amber-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      <span>LEADER PAGE</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-80">Command</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. MERGED DROPDOWN: OPERATIONS & FINANCE (Financial, Media, Promotion) */}
          <div 
            className="relative"
            onMouseEnter={() => setOpsDropdownOpen(true)}
            onMouseLeave={() => setOpsDropdownOpen(false)}
          >
            <button
              onClick={() => setOpsDropdownOpen(!opsDropdownOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
                currentView === 'financial' || currentView === 'social' || currentView === 'career'
                  ? 'bg-neutral-800 text-emerald-300 font-bold border border-emerald-500/50'
                  : 'text-neutral-400 hover:text-emerald-300'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <span>FINANCE & CAREER</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${opsDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {opsDropdownOpen && (
              <div className="absolute left-0 top-full pt-1 w-56 z-50 animate-in fade-in">
                <div className="rounded-xl border border-neutral-800 bg-[#0d100d] p-1.5 shadow-2xl space-y-1">
                  <button
                    onClick={() => handleNav('financial')}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer ${
                      currentView === 'financial' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-300 hover:bg-neutral-900 hover:text-emerald-400'
                    }`}
                  >
                    <span>FINANCIAL REWARDS</span>
                    <span className="text-[10px] font-mono text-emerald-400">$50M AP</span>
                  </button>
                  <button
                    onClick={() => handleNav('career')}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer ${
                      currentView === 'career' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-300 hover:bg-neutral-900 hover:text-amber-400'
                    }`}
                  >
                    <span>PROMOTION SYSTEM</span>
                    <span className="text-[10px] font-mono opacity-80">Ladder</span>
                  </button>
                  <button
                    onClick={() => handleNav('social')}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer ${
                      currentView === 'social' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-300 hover:bg-neutral-900 hover:text-cyan-400'
                    }`}
                  >
                    <span>MEDIA FEED</span>
                    <span className="text-[10px] font-mono opacity-80">Clips</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. MERGED DROPDOWN: COMMUNITY (Birthday, Achievement, Squad Chat) */}
          <div 
            className="relative"
            onMouseEnter={() => setCommunityDropdownOpen(true)}
            onMouseLeave={() => setCommunityDropdownOpen(false)}
          >
            <button
              onClick={() => setCommunityDropdownOpen(!communityDropdownOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
                currentView === 'birthdays' || currentView === 'squad-chat'
                  ? 'bg-neutral-800 text-pink-300 font-bold border border-pink-500/50'
                  : 'text-neutral-400 hover:text-pink-300'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-pink-400" />
              <span>COMMUNITY</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${communityDropdownOpen ? 'rotate-180 text-pink-400' : ''}`} />
            </button>

            {communityDropdownOpen && (
              <div className="absolute left-0 top-full pt-1 w-56 z-50 animate-in fade-in">
                <div className="rounded-xl border border-neutral-800 bg-[#0d100d] p-1.5 shadow-2xl space-y-1">
                  <button
                    onClick={() => handleNav('birthdays')}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer ${
                      currentView === 'birthdays' ? 'bg-pink-500 text-neutral-950 font-bold' : 'text-neutral-300 hover:bg-neutral-900 hover:text-pink-400'
                    }`}
                  >
                    <span>BIRTHDAY CALENDAR</span>
                    <span className="text-[10px] font-mono">Vault 🎂</span>
                  </button>
                  <button
                    onClick={() => handleNav('squad-chat')}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between cursor-pointer ${
                      currentView === 'squad-chat' ? 'bg-pink-500 text-neutral-950 font-bold' : 'text-neutral-300 hover:bg-neutral-900 hover:text-cyan-400'
                    }`}
                  >
                    <span>SQUAD COMMS CHAT</span>
                    <span className="text-[10px] font-mono text-cyan-400">Live</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 7. SKINS & CAR SHADERS */}
          <button
            onClick={() => handleNav('skins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
              currentView === 'skins'
                ? 'bg-neutral-800 text-emerald-300 font-bold border border-emerald-500/50'
                : 'text-neutral-400 hover:text-emerald-400'
            }`}
            title="Inspect authorized Special Forces skins and vehicle shaders"
          >
            <Shirt className="h-3.5 w-3.5 text-emerald-400" />
            <span>SKINS & SHADERS</span>
          </button>

          {/* 8. TACTICAL AI SYSTEM */}
          <button
            onClick={() => handleNav('ai-intel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
              currentView === 'ai-intel'
                ? 'bg-neutral-800 text-cyan-300 font-bold border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-neutral-400 hover:text-cyan-300'
            }`}
            title="Special Forces AI Assistant"
          >
            <Bot className="h-3.5 w-3.5 text-cyan-400" />
            <span>TACTICAL AI</span>
          </button>

          {/* 9. APPLY / ENLIST */}
          <button
            onClick={() => handleNav('recruitment')}
            className={`px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
              currentView === 'recruitment'
                ? 'bg-neutral-800 text-amber-300 font-bold border border-amber-500/50'
                : 'text-neutral-400 hover:text-amber-400'
            }`}
          >
            {t('recruitment')}
          </button>

          {/* 10. ADMIN STUDIO (HIGH COMMAND ONLY) */}
          {isUserAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all uppercase cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{t('admin')}</span>
            </button>
          )}

          {/* SETTINGS */}
          <button
            onClick={() => handleNav('settings')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              currentView === 'settings'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Settings & Preferences"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        </nav>

        {/* Right Section: Notification Center & User Account Menu */}
        <div className="flex items-center gap-2.5">
          {/* Notification Bell (Visible exclusively to verified USSF Members) */}
          {currentUser && currentUser.isMember && (
            <button
              onClick={() => {
                tacticalAudio.playTacticalClick();
                onOpenNotifications();
              }}
              className="relative p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-400 text-neutral-300 transition-colors cursor-pointer"
              title="Tactical Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-neutral-950 animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Presence Status Switcher (Online / Idle / DND) */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  tacticalAudio.playTacticalClick();
                  setPresenceDropdownOpen(!presenceDropdownOpen);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 hover:border-neutral-700 text-xs font-data cursor-pointer transition-all"
                title="Change Presence Status (Online / Idle / DND)"
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  currentUser.presenceStatus === 'Online' || (!currentUser.presenceStatus && currentUser.isOnlineCit)
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : currentUser.presenceStatus === 'Idle'
                    ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                    : currentUser.presenceStatus === 'DND'
                    ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                    : 'bg-neutral-500'
                }`} />
                <span className="hidden sm:inline font-bold uppercase text-[11px] text-neutral-200">
                  {currentUser.presenceStatus || 'Online'}
                </span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>

              {presenceDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-neutral-800 bg-[#0d100d] p-1.5 shadow-2xl z-50 text-xs font-data space-y-1">
                  <div className="px-2.5 py-1 text-[10px] text-neutral-500 uppercase font-mono border-b border-neutral-800/80 mb-1">
                    SET PRESENCE
                  </div>
                  {[
                    { status: 'Online', label: 'Online', dot: 'bg-emerald-400 animate-pulse', color: 'hover:bg-emerald-950/60 text-emerald-300' },
                    { status: 'Idle', label: 'Idle / AFK', dot: 'bg-amber-400', color: 'hover:bg-amber-950/60 text-amber-300' },
                    { status: 'DND', label: 'Do Not Disturb', dot: 'bg-rose-500', color: 'hover:bg-rose-950/60 text-rose-300' },
                    { status: 'Offline', label: 'Appear Offline', dot: 'bg-neutral-500', color: 'hover:bg-neutral-800 text-neutral-300' }
                  ].map(opt => (
                    <button
                      key={opt.status}
                      onClick={() => {
                        tacticalAudio.playTacticalClick();
                        onUpdatePresence?.(opt.status as DiscordPresenceStatus);
                        setPresenceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 cursor-pointer transition-colors ${opt.color} ${
                        currentUser.presenceStatus === opt.status ? 'bg-neutral-800 font-bold' : ''
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                  <div className="px-2.5 pt-1 text-[9px] text-neutral-500 border-t border-neutral-800/60">
                    Preferences persist across sessions
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Account / Profile Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg border border-neutral-700 bg-neutral-900 hover:border-amber-500 transition-colors cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl || '/src/assets/images/military_leader_training_1790341999734.jpg'}
                  alt={currentUser.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="text-xs font-tactical font-bold text-neutral-200 max-w-[100px] truncate hidden sm:inline">
                  {currentUser.name}
                </span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-neutral-800 bg-[#0d100d] p-2 shadow-2xl z-50 text-xs font-data">
                  <div className="px-3 py-2 border-b border-neutral-800 mb-1">
                    <div className="font-bold text-white">{currentUser.name}[USSF]</div>
                    <div className="text-[10px] text-emerald-400">{currentUser.cid} · {currentUser.rank}</div>
                  </div>
                  <button
                    onClick={() => handleNav('profile')}
                    className="w-full text-left px-3 py-2 rounded text-neutral-300 hover:bg-neutral-900 hover:text-amber-400 flex items-center gap-2"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>My Profile & Namecards</span>
                  </button>
                  <button
                    onClick={() => handleNav('squad-chat')}
                    className="w-full text-left px-3 py-2 rounded text-neutral-300 hover:bg-neutral-900 hover:text-cyan-400 flex items-center gap-2"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Squad Chat</span>
                  </button>
                  <button
                    onClick={() => handleNav('leaders')}
                    className="w-full text-left px-3 py-2 rounded text-neutral-300 hover:bg-neutral-900 hover:text-amber-400 flex items-center gap-2"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    <span>Command Leaders</span>
                  </button>
                  <button
                    onClick={() => handleNav('birthdays')}
                    className="w-full text-left px-3 py-2 rounded text-neutral-300 hover:bg-neutral-900 hover:text-pink-400 flex items-center gap-2"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Birthday Calendar</span>
                  </button>
                  <button
                    onClick={() => handleNav('settings')}
                    className="w-full text-left px-3 py-2 rounded text-neutral-300 hover:bg-neutral-900 hover:text-cyan-400 flex items-center gap-2"
                  >
                    <SettingsIcon className="h-3.5 w-3.5" />
                    <span>Settings & Languages</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      closeDropdowns();
                    }}
                    className="w-full text-left px-3 py-2 rounded text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 mt-1 border-t border-neutral-800/80"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                tacticalAudio.playTacticalClick();
                onOpenAuth();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-tactical font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
            >
              LOGIN / JOIN
            </button>
          )}


          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-neutral-800 bg-[#0a0c0a] px-4 py-4 space-y-3 font-tactical text-xs animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleNav('home')} className="p-2 rounded bg-neutral-900 text-left text-neutral-200">HOME</button>
            <button onClick={() => handleNav('groupInfo')} className="p-2 rounded bg-neutral-900 text-left text-amber-400">GROUP INFO</button>
            <button onClick={() => handleNav('operations')} className="p-2 rounded bg-neutral-900 text-left text-emerald-400">PATROL & TRAINING</button>
            <button onClick={() => handleNav('roster')} className="p-2 rounded bg-neutral-900 text-left text-neutral-200">RANK AND ROSTER</button>
            <button onClick={() => handleNav('leaders')} className="p-2 rounded bg-neutral-900 text-left text-amber-300">LEADERS</button>
            <button onClick={() => handleNav('financial')} className="p-2 rounded bg-neutral-900 text-left text-emerald-300">FINANCIAL TASKS</button>
            <button onClick={() => handleNav('career')} className="p-2 rounded bg-neutral-900 text-left text-amber-400">PROMOTION SYSTEM</button>
            <button onClick={() => handleNav('social')} className="p-2 rounded bg-neutral-900 text-left text-cyan-300">MEDIA FEED</button>
            <button onClick={() => handleNav('birthdays')} className="p-2 rounded bg-neutral-900 text-left text-pink-300">BIRTHDAYS</button>
            <button onClick={() => handleNav('squad-chat')} className="p-2 rounded bg-neutral-900 text-left text-cyan-400">SQUAD COMMS</button>
            <button onClick={() => handleNav('skins')} className="p-2 rounded bg-neutral-900 text-left text-emerald-400">SKINS & SHADERS</button>
            <button onClick={() => handleNav('ai-intel')} className="p-2 rounded bg-neutral-900 text-left text-cyan-300">TACTICAL AI</button>
            <button onClick={() => handleNav('recruitment')} className="p-2 rounded bg-neutral-900 text-left text-amber-400">APPLY FOR USSF</button>
            {isUserAdmin && (
              <button onClick={() => handleNav('admin')} className="p-2 rounded bg-amber-500 text-neutral-950 font-black text-left col-span-2">ADMIN STUDIO</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
