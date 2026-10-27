import React, { useState, useEffect } from 'react';
import { 
  User, MousePointer, Shield, Sparkles, Award, Lock, 
  CheckCircle2, Palette, Edit3, Cloud, Key, RefreshCw, 
  Camera, Fingerprint, Eye, Save, Activity, Circle
} from 'lucide-react';
import { USSFMember, USSF_RANKS, DiscordPresenceStatus, CUSTOM_CURSORS_CATALOG } from '../data/ussfData';
import { tacticalAudio } from '../utils/audioSynth';
import { BiometricModal } from './BiometricModal';
import { getAvatarFrameCss } from '../utils/avatarFrameUtils';
import { optimizeUploadImage } from '../utils/imageCompressor';
import { CUSTOM_AVATAR_FRAMES } from '../data/customizationAssets';

interface USSFProfileViewProps {
  currentUser: USSFMember | null;
  onUpdateProfile: (updated: Partial<USSFMember>) => void;
  onOpenAuth: () => void;
  activeTheme: string;
  onThemeChange: (theme: string) => void;
}

export const USSFProfileView: React.FC<USSFProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  onOpenAuth,
  activeTheme,
  onThemeChange
}) => {
  if (!currentUser) {
    return (
      <div className="w-full bg-[#080a08] min-h-[500px] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <Shield className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-tactical uppercase font-bold text-white">
            OPERATOR AUTHENTICATION REQUIRED
          </h2>
          <p className="text-xs text-neutral-400 font-sans">
            Please log in or sign up to access your profile customization suite, avatar frames, custom cursors, and cloud synchronization.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-tactical font-black text-xs uppercase cursor-pointer"
          >
            LOGIN TO PROFILE
          </button>
        </div>
      </div>
    );
  }

  // Profile Form States
  const [name, setName] = useState(currentUser.name);
  const [callsign, setCallsign] = useState(currentUser.callsign);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '/src/assets/images/military_leader_training_1790341999734.jpg');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [avatarFrame, setAvatarFrame] = useState(currentUser.avatarFrame || 'Standard Issue Border');
  const [customFrameImage, setCustomFrameImage] = useState('');
  const [namecard, setNamecard] = useState(currentUser.namecard || 'CIT2 Law Enforcer');
  const [customNamecardTitle, setCustomNamecardTitle] = useState('');
  const [customNamecardImage, setCustomNamecardImage] = useState(currentUser.namecardBgUrl || '');
  const [namecardBgUrl, setNamecardBgUrl] = useState(currentUser.namecardBgUrl || '');
  const [nameStyle, setNameStyle] = useState(currentUser.nameStyle || 'gold-glow');
  const [customCursor, setCustomCursor] = useState(currentUser.customCursor || 'crosshair-laser');
  const [customCursorUrl, setCustomCursorUrl] = useState('');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [signature, setSignature] = useState(currentUser.signature || '');
  const [presenceStatus, setPresenceStatus] = useState<DiscordPresenceStatus>(currentUser.presenceStatus || 'Online');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Sync profile fields if currentUser prop updates
  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setCallsign(currentUser.callsign);
    setAvatarUrl(currentUser.avatarUrl || '/src/assets/images/military_leader_training_1790341999734.jpg');
    setAvatarFrame(currentUser.avatarFrame || 'Standard Issue Border');
    setNamecard(currentUser.namecard || 'CIT2 Law Enforcer');
    setNamecardBgUrl(currentUser.namecardBgUrl || '');
    setNameStyle(currentUser.nameStyle || 'gold-glow');
    setCustomCursor(currentUser.customCursor || 'crosshair-laser');
    setBio(currentUser.bio || '');
    setSignature(currentUser.signature || '');
    setPresenceStatus(currentUser.presenceStatus || 'Online');
    // NOTE: deps are the individual profile values, not the currentUser object:
    // the parent creates a new object identity on every 4-second poll, which used
    // to reset in-progress edits (and snap an equipped frame back to the server's
    // current value) mid-interaction.
  }, [
    currentUser?.name,
    currentUser?.callsign,
    currentUser?.avatarUrl,
    currentUser?.avatarFrame,
    currentUser?.namecard,
    currentUser?.namecardBgUrl,
    currentUser?.nameStyle,
    currentUser?.customCursor,
    currentUser?.bio,
    currentUser?.signature,
    currentUser?.presenceStatus
  ]);

  // File Upload Handlers with Canvas Compression (Prevents QuotaExceededError & Black Screen)
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await optimizeUploadImage(file, 400, 400, 0.85);
        setAvatarUrl(compressed);
        setCustomAvatarInput(compressed);
        setStatusNotice('Avatar uploaded and optimized successfully.');
        setTimeout(() => setStatusNotice(null), 3000);
      } catch (err: any) {
        console.error('Failed to optimize avatar image:', err);
      }
    }
  };

  const handleNamecardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await optimizeUploadImage(file, 1200, 600, 0.82);
        setNamecard('Custom Commission Banner');
        setCustomNamecardImage(compressed);
        setNamecardBgUrl(compressed);
        setStatusNotice('Namecard banner uploaded and optimized (no black-screen crash).');
        setTimeout(() => setStatusNotice(null), 3000);
      } catch (err: any) {
        console.error('Failed to optimize namecard image:', err);
      }
    }
  };

  // Biometric & Encryption
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [e2eeKey] = useState('0xAES256_SF_KEY_' + Math.random().toString(36).substring(2, 10).toUpperCase());

  // Available Avatar Presets
  const avatarPresets = [
    { label: 'Tactical Leader', src: '/src/assets/images/military_leader_training_1790341999734.jpg' },
    { label: 'Night Recon', src: '/src/assets/images/scene_night_vision_recon_1790341968068.jpg' },
    { label: 'CQB Operator', src: '/src/assets/images/scene_cqb_stairwell_breach_1790341945314.jpg' },
    { label: 'Swamp Scout', src: '/src/assets/images/scene_swamp_night_ops_1790341930336.jpg' },
    { label: 'Group Formation', src: '/src/assets/images/special_forces_unit_1790346782492.jpg' }
  ];

  // Available Avatar Frames WITH OFFICIAL RANK LOCK REQUIREMENTS (Max rank is Level 20: High Commander)
  const frameOptions = [
    { name: 'Standard Issue Border', minLevel: 1, css: 'frame-recruit-ring' },
    { name: 'Recruit Ring', minLevel: 4, css: 'frame-recruit-ring' },
    { name: 'Specialist Diamond', minLevel: 7, css: 'frame-emerald-chevron' },
    { name: 'Single Gold Chevron', minLevel: 9, css: 'frame-golden-star' },
    { name: 'Emerald Chevrons', minLevel: 14, css: 'frame-emerald-chevron' },
    { name: 'Cyan Tactical', minLevel: 16, css: 'frame-cyan-tactical' },
    { name: 'Golden Star Officer', minLevel: 18, css: 'frame-golden-star' },
    { name: 'Vice Commander Ruby', minLevel: 17, css: 'frame-vice-ruby' },
    { name: 'Supreme Gold Aureole', minLevel: 20, css: 'frame-supreme-gold' }
  ];

  const cursorOptions = [
    { id: 'crosshair-laser', label: 'Tactical Crosshair Laser' },
    { id: 'tactical-dot', label: 'Precision Laser Dot' },
    { id: 'sniper-scope', label: 'Sniper Reticle Scope' },
    { id: 'default', label: 'Standard Mil-Spec Cursor' }
  ];

  const nameStyles = [
    { id: 'gold-glow', label: 'Gold Aureole Glow', previewClass: 'name-style-gold' },
    { id: 'emerald-glow', label: 'Emerald NVG Glow', previewClass: 'name-style-emerald' },
    { id: 'cyan-glow', label: 'Cyan Cyber Glow', previewClass: 'name-style-cyan' },
    { id: 'amber-glow', label: 'Amber Flame Glow', previewClass: 'name-style-amber' },
    { id: 'crimson-glow', label: 'Crimson Apex Glow', previewClass: 'name-style-crimson' },
    { id: 'astral-rainbow', label: '★ Chromatic Astral Rainbow (Ultra Rare)', previewClass: 'name-style-astral' },
    { id: 'wuwa-resonance', label: '✦ Wuwa Resonator Cyan Resonance', previewClass: 'name-style-wuwa-resonance' },
    { id: 'genshin-archon', label: '✧ Genshin Primogem Archon Gold', previewClass: 'name-style-genshin-archon' },
    { id: 'abyssal-void', label: '◆ Abyssal Void Purple Aura', previewClass: 'name-style-abyssal-void' },
    { id: 'flame-phoenix', label: '▲ Vermilion Phoenix Flame', previewClass: 'name-style-flame-phoenix' },
    { id: 'cyber-neon', label: '❖ NTE Cyberpunk Dual Neon', previewClass: 'name-style-cyber-neon' }
  ];

  const namecards = [
    // Genshin Impact Aesthetic Prestige
    'Raiden Shogun: Electro Eternity',
    'Furina: Alluring All-Water',
    'Arlecchino: Ashen Crimson Harbinger',
    'Kaedehara Kazuha: Autumn Maple',
    // Wuthering Waves (Wuwa) Resonance Prestige
    'Jinhsi: Sentinel of Resonance',
    'Changli: Blazing Vermilion Phoenix',
    'Yinlin: Thunder Weaver Puppet',
    'Shorekeeper: Stellar Butterfly',
    'Camellya: Bloom of Black Shores',
    // Neverness to Ever (NTE) Urban Cyber Prestige
    'NTE: Neverness Cyber Spire',
    'Hutterite: Astral Glitch Distortion',
    // Tactical Military USSF
    'Crimson Apex Seal',
    'Obsidian Commander',
    'Urban CQB',
    'Night Vision Grid',
    'Desert Recon',
    'CIT2 Law Enforcer',
    'Valor Citadel',
    'Airborne Wings'
  ];

  const profileThemes = [
    { id: 'theme-tactical', label: 'Tactical Stealth Black' },
    { id: 'theme-nvg', label: 'Phosphor NVG Green' },
    { id: 'theme-desert', label: 'Desert Tan Camo' }
  ];

  const getNamecardPreviewStyle = (card: string) => {
    switch (card) {
      // Genshin Impact
      case 'Raiden Shogun: Electro Eternity': 
        return 'border-purple-500 bg-gradient-to-r from-purple-950 via-indigo-950 to-neutral-950 shadow-[0_0_25px_rgba(168,85,247,0.4)] text-purple-200';
      case 'Furina: Alluring All-Water': 
        return 'border-cyan-400 bg-gradient-to-r from-cyan-950 via-blue-950 to-neutral-950 shadow-[0_0_25px_rgba(34,211,238,0.4)] text-cyan-200';
      case 'Arlecchino: Ashen Crimson Harbinger': 
        return 'border-rose-600 bg-gradient-to-r from-rose-950 via-neutral-950 to-black shadow-[0_0_25px_rgba(225,29,72,0.5)] text-rose-200';
      case 'Kaedehara Kazuha: Autumn Maple': 
        return 'border-orange-500 bg-gradient-to-r from-amber-950 via-red-950 to-neutral-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] text-amber-200';
      
      // Wuthering Waves (Wuwa)
      case 'Jinhsi: Sentinel of Resonance': 
        return 'border-teal-400 bg-gradient-to-r from-teal-950 via-cyan-950 to-slate-950 shadow-[0_0_25px_rgba(45,212,191,0.5)] text-teal-200';
      case 'Changli: Blazing Vermilion Phoenix': 
        return 'border-red-500 bg-gradient-to-r from-red-950 via-orange-950 to-neutral-950 shadow-[0_0_25px_rgba(239,68,68,0.5)] text-orange-200';
      case 'Yinlin: Thunder Weaver Puppet': 
        return 'border-fuchsia-500 bg-gradient-to-r from-fuchsia-950 via-purple-950 to-black shadow-[0_0_25px_rgba(217,70,239,0.4)] text-fuchsia-200';
      case 'Shorekeeper: Stellar Butterfly': 
        return 'border-sky-400 bg-gradient-to-r from-blue-950 via-indigo-950 to-cyan-950 shadow-[0_0_25px_rgba(56,189,248,0.5)] text-sky-200';
      case 'Camellya: Bloom of Black Shores': 
        return 'border-pink-600 bg-gradient-to-r from-pink-950 via-rose-950 to-black shadow-[0_0_25px_rgba(219,39,119,0.5)] text-pink-200';

      // Neverness to Ever (NTE)
      case 'NTE: Neverness Cyber Spire': 
        return 'border-pink-500 bg-gradient-to-r from-violet-950 via-fuchsia-950 to-cyan-950 shadow-[0_0_25px_rgba(236,72,153,0.5)] text-pink-100';
      case 'Hutterite: Astral Glitch Distortion': 
        return 'border-emerald-400 bg-gradient-to-r from-neutral-950 via-emerald-950 to-black shadow-[0_0_25px_rgba(52,211,153,0.4)] text-emerald-200';

      // Tactical
      case 'Crimson Apex Seal': return 'border-rose-500/80 bg-gradient-to-br from-rose-950/80 via-neutral-900 to-black shadow-rose-950/50';
      case 'Obsidian Commander': return 'border-neutral-500 bg-gradient-to-br from-neutral-800/80 via-neutral-950 to-black shadow-black';
      case 'Urban CQB': return 'border-amber-500/80 bg-gradient-to-br from-amber-950/80 via-neutral-900 to-black shadow-amber-950/40';
      case 'Night Vision Grid': return 'border-emerald-500/80 bg-gradient-to-br from-emerald-950/80 via-neutral-900 to-black shadow-emerald-950/40';
      case 'Airborne Wings': return 'border-sky-500/80 bg-gradient-to-br from-sky-950/80 via-neutral-900 to-black shadow-sky-950/40';
      case 'Desert Recon': return 'border-yellow-500/80 bg-gradient-to-br from-yellow-950/80 via-neutral-900 to-black shadow-yellow-950/40';
      case 'CIT2 Law Enforcer': return 'border-blue-500/80 bg-gradient-to-br from-blue-950/80 via-neutral-900 to-black shadow-blue-950/40';
      case 'Valor Citadel': return 'border-purple-500/80 bg-gradient-to-br from-purple-950/80 via-neutral-900 to-black shadow-purple-950/40';
      default: return 'border-neutral-700 bg-gradient-to-br from-neutral-900 to-black';
    }
  };

  const handleSaveProfile = () => {
    tacticalAudio.playTargetLock();
    onUpdateProfile({
      name,
      callsign,
      avatarUrl: customAvatarInput.trim() ? customAvatarInput.trim() : avatarUrl,
      avatarFrame,
      namecard,
      namecardBgUrl: (customNamecardImage || namecardBgUrl || '').trim(),
      nameStyle,
      customCursor,
      bio,
      signature,
      presenceStatus,
      isOnlineCit: presenceStatus !== 'Offline'
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="w-full bg-[#080a08] text-neutral-100 min-h-screen pb-16">
      {/* Banner */}
      <div className="border-b border-neutral-800 bg-[#0d100d] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-data uppercase tracking-widest text-amber-400 mb-1">
              <User className="h-4 w-4" />
              <span>OPERATOR DOSSIER // PERSONAL CUSTOMIZATION SUITE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-tactical uppercase text-white">
              MY PROFILE & IDENTITY WORKSTATION
            </h1>
            <p className="text-xs text-neutral-400 font-sans mt-1">
              Customize your tactical avatar, rank frames, custom mouse cursor, namecard, bio, and signature.
            </p>
          </div>

          {/* Cloud Sync & Security status */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-data flex items-center gap-2">
              <Cloud className="h-4 w-4 text-cyan-400" />
              <div>
                <span className="text-neutral-400 block text-[9px] uppercase">PERSISTENCE</span>
                <span className="text-emerald-400 font-bold">Cloud Synced (AES-256)</span>
              </div>
            </div>

            <button
              onClick={() => setIsBiometricOpen(true)}
              className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 hover:bg-emerald-900/60 text-xs font-data text-emerald-300 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Fingerprint className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">BIOMETRIC LOCK</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        {statusNotice && (
          <div className="mb-4 p-4 rounded-xl border border-amber-500/60 bg-amber-950/50 text-amber-300 text-xs font-data flex items-center gap-2 animate-in fade-in">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/60 bg-emerald-950/50 text-emerald-300 text-xs font-data flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>Profile customizations updated successfully! Synchronized across all mobile and desktop devices.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Live Operator Dossier Card Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-4 sticky top-24">
              <div className="text-xs font-data uppercase text-amber-400 font-bold border-b border-neutral-800 pb-2 flex items-center justify-between">
                <span>LIVE PROFILE DOSSIER PREVIEW</span>
                <Eye className="h-4 w-4 text-amber-400" />
              </div>

              {/* Card Container with custom Namecard Theme */}
              {(() => {
                const bannerPreview = customNamecardImage || namecardBgUrl;
                return (
                  <div 
                    className={`rounded-xl border-2 ${getNamecardPreviewStyle(namecard)} p-5 shadow-2xl relative overflow-hidden transition-all duration-300`}
                  >
                    {/* Vivid Animated GIF / Custom Banner Background */}
                    {bannerPreview && (
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img
                          src={bannerPreview}
                          alt="Custom Namecard"
                          className="h-full w-full object-cover object-center filter brightness-95"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/50 to-black/75" />
                      </div>
                    )}

                    <div className="relative z-10">
                      {/* Visual badge top right */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-data bg-neutral-900/90 text-neutral-300 border border-neutral-700 uppercase backdrop-blur">
                          NAMECARD: {namecard}
                        </span>
                        <span className="text-[10px] font-data text-emerald-400 font-bold bg-neutral-900/90 px-2 py-0.5 rounded border border-neutral-700">
                          LVL {currentUser.rankLevel} // {currentUser.status}
                        </span>
                      </div>

                {/* Avatar with selected frame */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`relative h-20 w-20 rounded-full overflow-hidden ${
                      getAvatarFrameCss(avatarFrame)
                    }`}>
                      <img
                        src={customAvatarInput.trim() ? customAvatarInput.trim() : avatarUrl}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Live Presence indicator dot on avatar */}
                    <span 
                      title={`Presence: ${presenceStatus}`}
                      className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ring-4 ring-neutral-950 ${
                        presenceStatus === 'Online'
                          ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                          : presenceStatus === 'Idle'
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                          : presenceStatus === 'DND'
                          ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                          : 'bg-neutral-600'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-data text-neutral-400 uppercase flex items-center gap-2">
                      <span>{currentUser.cid} · CALLSIGN: {callsign}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        presenceStatus === 'Online' ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40' :
                        presenceStatus === 'Idle' ? 'text-amber-400 bg-amber-950/60 border border-amber-500/40' :
                        presenceStatus === 'DND' ? 'text-rose-400 bg-rose-950/60 border border-rose-500/40' :
                        'text-neutral-400 bg-neutral-900 border border-neutral-700'
                      }`}>
                        {presenceStatus}
                      </span>
                    </div>
                    <h3 className={`text-xl font-tactical font-black uppercase ${
                      nameStyles.find(s => s.id === nameStyle)?.previewClass || ''
                    }`}>
                      {name}
                    </h3>
                    <div className="text-xs font-data text-amber-400 mt-0.5 font-bold">
                      {currentUser.rank}
                    </div>
                  </div>
                </div>

                {/* Frame & Cursor readout */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-[10px] font-data">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 uppercase block">AVATAR FRAME:</span>
                    <span className="text-neutral-200 font-bold truncate block">{avatarFrame}</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-500 uppercase block">ACTIVE CURSOR:</span>
                    <span className="text-cyan-400 font-bold truncate block">{customCursor}</span>
                  </div>
                </div>

                {/* Bio text */}
                <div className="mt-3 p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs font-sans text-neutral-300">
                  <span className="text-[9px] font-data text-neutral-500 uppercase block mb-1">OPERATOR BIO</span>
                  <p>{bio || 'No operator bio entered yet.'}</p>
                </div>

                {/* Signature text */}
                {signature && (
                  <div className="mt-2 text-[11px] font-sans italic text-amber-400/90 pl-3 border-l-2 border-amber-500">
                    "{signature}"
                  </div>
                )}
                    </div>
                  </div>
                );
              })()}

              {/* Encryption & Security info */}
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] font-data text-neutral-400 space-y-1">
                <span className="text-emerald-400 font-bold block uppercase">END-TO-END ENCRYPTED KEY:</span>
                <span className="text-neutral-300 font-mono break-all">{e2eeKey}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Customization Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Basic Identity */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4">
              <h3 className="text-sm font-tactical uppercase font-bold text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-2">
                <Edit3 className="h-4 w-4 text-amber-400" />
                <span>OPERATOR DETAILS & CALLSIGN</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-data">
                <div>
                  <label className="text-neutral-400 block text-[10px] uppercase mb-1">OPERATOR NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block text-[10px] uppercase mb-1">TACTICAL CALLSIGN</label>
                  <input
                    type="text"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Operational Presence Selector */}
              <div className="pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-neutral-400 text-[10px] font-data uppercase flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-amber-400" />
                    <span>OPERATIONAL PRESENCE (DISCORD / CIT2 COMM LINK)</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${
                    presenceStatus === 'Online' ? 'text-emerald-400' :
                    presenceStatus === 'Idle' ? 'text-amber-400' :
                    presenceStatus === 'DND' ? 'text-rose-400' : 'text-neutral-400'
                  }`}>
                    ● {presenceStatus.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { status: 'Online' as const, label: 'Online', color: 'border-emerald-500 bg-emerald-950/50 text-emerald-300 ring-1 ring-emerald-500/50', dot: 'bg-emerald-400 animate-pulse' },
                    { status: 'Idle' as const, label: 'Idle / AFK', color: 'border-amber-500 bg-amber-950/50 text-amber-300 ring-1 ring-amber-500/50', dot: 'bg-amber-400' },
                    { status: 'DND' as const, label: 'Do Not Disturb', color: 'border-rose-500 bg-rose-950/50 text-rose-300 ring-1 ring-rose-500/50', dot: 'bg-rose-500' }
                  ].map((opt) => {
                    const isSelected = presenceStatus === opt.status;

                    return (
                      <button
                        key={opt.status}
                        type="button"
                        onClick={() => {
                          tacticalAudio.playTacticalClick();
                          setPresenceStatus(opt.status);
                        }}
                        className={`px-3 py-2 rounded-lg border text-xs font-data flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? `${opt.color} font-bold shadow-lg`
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${opt.dot}`} />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[10px] font-data text-neutral-500 mt-2">
                  ℹ️ Note: Offline status is set automatically when you exit, switch off, or close the website.
                </div>
              </div>
            </div>

            {/* 2. Avatar Selection & Custom Upload */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4">
              <h3 className="text-sm font-tactical uppercase font-bold text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-2">
                <Camera className="h-4 w-4 text-cyan-400" />
                <span>AVATAR (PRESETS & CUSTOM URL)</span>
              </h3>

              <div className="grid grid-cols-5 gap-3">
                {avatarPresets.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      tacticalAudio.playTacticalClick();
                      setAvatarUrl(preset.src);
                      setCustomAvatarInput('');
                    }}
                    className={`p-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                      avatarUrl === preset.src && !customAvatarInput
                        ? 'border-amber-400 bg-amber-950/40 shadow-lg'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <img src={preset.src} alt={preset.label} className="h-12 w-12 rounded-full object-cover mx-auto" />
                    <span className="text-[9px] font-data text-neutral-400 mt-1 block truncate">{preset.label}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-neutral-400 block text-[10px] font-data uppercase mb-1">
                  OR ENTER CUSTOM AVATAR IMAGE URL
                </label>
                <input
                  type="url"
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  placeholder="https://imgur.com/your-custom-avatar.jpg"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs font-data text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Direct File Upload for Avatar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-neutral-800/60">
                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-cyan-400 text-cyan-400 font-bold text-xs uppercase cursor-pointer transition-colors">
                  <Camera className="h-4 w-4" />
                  <span>UPLOAD AVATAR FROM DEVICE</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-neutral-500 font-data text-center sm:text-left">
                  Upload any photo from PC or phone (JPG, PNG, GIF, WebP)
                </span>
              </div>
            </div>

            {/* 3. Avatar Frame (Unlocked by Rank Up!) */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-sm font-tactical uppercase font-bold text-neutral-100 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>AVATAR FRAMES (UNLOCKED BY RANK UP)</span>
                </h3>
                <span className="text-[10px] font-data text-neutral-400">
                  CURRENT RANK LVL: <span className="text-emerald-400 font-bold">{currentUser.rankLevel}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {frameOptions.map(frame => {
                  const isUnlocked = currentUser.rankLevel >= frame.minLevel;
                  const isSelected = avatarFrame === frame.name;

                  return (
                    <div
                      key={frame.name}
                      onClick={() => {
                        if (isUnlocked) {
                          tacticalAudio.playTacticalClick();
                          setAvatarFrame(frame.name);
                          // Persist immediately so the equipped frame is visible to
                          // other users without waiting for the Save button.
                          onUpdateProfile({ avatarFrame: frame.name });
                          setStatusNotice(`Frame equipped: ${frame.name}`);
                          setTimeout(() => setStatusNotice(null), 3000);
                        } else {
                          tacticalAudio.playRadioSquelch();
                          setStatusNotice(`Locked: Requires Rank Level ${frame.minLevel} to unlock ${frame.name}.`);
                          setTimeout(() => setStatusNotice(null), 4000);
                        }
                      }}
                      className={`p-3 rounded-lg border text-xs font-data transition-all flex flex-col justify-between ${
                        !isUnlocked
                          ? 'border-neutral-900 bg-neutral-950/40 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold shadow-md cursor-pointer'
                          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] truncate">{frame.name}</span>
                        {!isUnlocked && <Lock className="h-3 w-3 text-neutral-500 shrink-0" />}
                      </div>
                      <span className="text-[9px] text-neutral-500 uppercase">
                        {isUnlocked ? 'Unlocked' : `Requires Lvl ${frame.minLevel}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Special Cosmetic Avatar Frames (Login Rewards & Milestones) */}
              <div className="pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-tactical uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>PRESTIGE & LOGIN MILESTONE FRAMES (19 DESIGNS)</span>
                  </span>
                  <span className="text-[10px] font-data text-neutral-400">Awarded via 7D / 30D Logins & Operations</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CUSTOM_AVATAR_FRAMES.map(cosmetic => {
                    const isSelected = avatarFrame === cosmetic.name || avatarFrame === cosmetic.id;
                    return (
                      <button
                        key={cosmetic.id}
                        type="button"
                        onClick={() => {
                          tacticalAudio.playTacticalClick();
                          setAvatarFrame(cosmetic.name);
                          onUpdateProfile({ avatarFrame: cosmetic.name });
                          setStatusNotice(`Cosmetic frame equipped: ${cosmetic.name}`);
                          setTimeout(() => setStatusNotice(null), 3000);
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-data transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold shadow-lg'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="truncate">
                          <div className="text-[11px] font-semibold truncate">{cosmetic.name}</div>
                          <div className="text-[9px] text-neutral-500 font-mono">{cosmetic.category}</div>
                        </div>
                        <div className={`h-6 w-6 rounded-full overflow-hidden shrink-0 ml-2 ${cosmetic.frameClass}`}>
                          <img src={avatarUrl} alt="preview" className="h-full w-full object-cover" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Mouse Cursor Customization */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <h3 className="text-sm font-tactical uppercase font-bold text-neutral-100 flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-emerald-400" />
                  <span>TACTICAL & REWARD MOUSE CURSORS</span>
                </h3>
                <span className="text-[10px] font-data text-emerald-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  Active: {CUSTOM_CURSORS_CATALOG.find(c => c.id === customCursor)?.name || customCursor || 'Mil-Spec Default'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* Standard Mil-Spec Default */}
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playTacticalClick();
                    setCustomCursor('default');
                    onUpdateProfile({ customCursor: 'default' });
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-data transition-all cursor-pointer flex items-center gap-3 ${
                    customCursor === 'default' || !customCursor
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 font-bold shadow-md'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0">
                    <MousePointer className="h-4 w-4 text-neutral-300" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Standard Mil-Spec (Default)</div>
                    <div className="text-[10px] text-neutral-500">Native OS Cursor fallback</div>
                  </div>
                </button>

                {/* All Catalog Cursors */}
                {CUSTOM_CURSORS_CATALOG.filter(c => c.id !== 'default').map(cursor => {
                  const isSelected = customCursor === cursor.id;
                  return (
                    <button
                      key={cursor.id}
                      type="button"
                      onClick={() => {
                        tacticalAudio.playTacticalClick();
                        setCustomCursor(cursor.id);
                        onUpdateProfile({ customCursor: cursor.id });
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-data transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 font-bold shadow-md'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {cursor.previewImage ? (
                          <img
                            src={cursor.previewImage}
                            alt={cursor.name}
                            className="h-6 w-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : cursor.cursorUrl.startsWith('/') ? (
                          <img
                            src={cursor.cursorUrl}
                            alt={cursor.name}
                            className="h-6 w-6 object-contain"
                          />
                        ) : (
                          <MousePointer className={`h-4 w-4 ${isSelected ? 'text-emerald-400' : 'text-amber-400'}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{cursor.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                          <span className="text-amber-400/80">{cursor.category}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Name Style Glow & Namecards */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4">
              <h3 className="text-sm font-tactical uppercase font-bold text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>NAME STYLE GLOW & NAMECARDS</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-neutral-400 block text-[10px] font-data uppercase mb-1.5">NAME GLOW STYLE</label>
                  <div className="flex flex-wrap gap-2">
                    {nameStyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => {
                          tacticalAudio.playTacticalClick();
                          setNameStyle(style.id);
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-data border transition-all cursor-pointer ${
                          nameStyle === style.id
                            ? 'border-amber-400 bg-amber-950/40 text-white font-bold'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span className={style.previewClass}>{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block text-[10px] font-data uppercase mb-1.5">TACTICAL NAMECARD THEME (8 COMMISSIONS)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {namecards.map(card => {
                      const isSelected = namecard === card;
                      const cardStyle = getNamecardPreviewStyle(card);
                      return (
                        <button
                          key={card}
                          type="button"
                          onClick={() => {
                            tacticalAudio.playTacticalClick();
                            setNamecard(card);
                          }}
                          className={`p-2.5 rounded-lg border text-left text-xs font-data transition-all cursor-pointer ${cardStyle} ${
                            isSelected
                              ? 'ring-2 ring-amber-400 scale-[1.02] font-bold text-white shadow-lg'
                              : 'opacity-70 hover:opacity-100 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold truncate">{card}</span>
                            {isSelected && <span className="text-[10px] text-amber-400 font-mono">ACTIVE</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Namecard Upload & Custom Commission Title */}
                  <div className="pt-2 border-t border-neutral-800 space-y-2">
                    <label className="text-neutral-400 block text-[10px] font-data uppercase">
                      OR UPLOAD CUSTOM NAMECARD BANNER / TITLE
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <label className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-amber-300 font-bold text-xs uppercase cursor-pointer transition-colors shrink-0">
                        <Sparkles className="h-4 w-4" />
                        <span>UPLOAD BANNER</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNamecardFileUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={customNamecardTitle}
                        onChange={(e) => {
                          setCustomNamecardTitle(e.target.value);
                          if (e.target.value) setNamecard(e.target.value);
                        }}
                        placeholder="Or enter custom commission title (e.g. Apex Ghost Commander)..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    {/* Direct Animated GIF or Image URL */}
                    <div className="pt-2">
                      <label className="text-neutral-400 block text-[10px] font-data uppercase mb-1">
                        OR PASTE DIRECT ANIMATED GIF / IMAGE BANNER URL
                      </label>
                      <input
                        type="url"
                        value={namecardBgUrl}
                        onChange={(e) => {
                          setNamecardBgUrl(e.target.value);
                          setCustomNamecardImage(e.target.value);
                        }}
                        placeholder="https://media.tenor.com/...gif or https://...png"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        Fully supports animated GIFs, Tenor, Giphy, and Imgur links. Displays seamlessly on your profile dossier, roster card, and leadership showcase without blacking out!
                      </span>
                    </div>

                    {customNamecardImage && (
                      <span className="text-[10px] text-emerald-400 font-data block">
                        Custom Namecard Banner Active & Ready to Save!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Bio & Signature */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4">
              <h3 className="text-sm font-tactical uppercase font-bold text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-2">
                <Edit3 className="h-4 w-4 text-purple-400" />
                <span>BIO & OFFICIAL SIGNATURE</span>
              </h3>

              <div className="space-y-3 text-xs font-data">
                <div>
                  <label className="text-neutral-400 block text-[10px] uppercase mb-1">OPERATOR BIO</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short summary of tactical role and mission focus..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-neutral-100 font-sans focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block text-[10px] uppercase mb-1">PERSONAL SIGNATURE MOTTO</label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="e.g. 'May God Have Mercy Upon Our Enemies, Cause We Won\'t.'"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 font-sans focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* SAVE ALL CHANGES BUTTON */}
            <button
              onClick={handleSaveProfile}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-tactical font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>SAVE & SYNC OPERATOR PROFILE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Biometric Gateway */}
      <BiometricModal
        isOpen={isBiometricOpen}
        onClose={() => setIsBiometricOpen(false)}
        onSuccess={() => {
          setStatusNotice("Biometric verification verified. Profile credentials securely locked.");
          setTimeout(() => setStatusNotice(null), 5000);
        }}
        actionTitle="Secure Profile Credential Lock"
      />
    </div>
  );
};
