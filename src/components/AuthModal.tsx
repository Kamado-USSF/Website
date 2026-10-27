import React, { useState } from 'react';
import { 
  Lock, User, Key, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, X, Fingerprint, Eye, EyeOff
} from 'lucide-react';
import { ForgotPasswordRequest, USSFMember, KAMADO_ADMIN_ACCOUNT } from '../data/ussfData';
import { tacticalAudio } from '../utils/audioSynth';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (member: USSFMember, keepLoggedIn: boolean) => void;
  members: USSFMember[];
  onSubmitForgotPw: (req: ForgotPasswordRequest) => void;
  onOwnerBootstrap?: (bootstrapData: {
    ownerName: string;
    cid: string;
    passphrase: string;
    password: string;
  }) => { success: boolean; message: string };
  isBootstrapAvailable?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  members,
  onSubmitForgotPw,
  onOwnerBootstrap,
  isBootstrapAvailable = false
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'bootstrap'>('login');

  // Form Fields
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(true);

  // Sign up fields
  const [signupCallsign, setSignupCallsign] = useState('');
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);

  // Owner Bootstrap fields
  const [bootstrapPassphrase, setBootstrapPassphrase] = useState('');
  const [bootstrapOwnerName, setBootstrapOwnerName] = useState('');
  const [bootstrapCid, setBootstrapCid] = useState('SF-001');
  const [bootstrapPassword, setBootstrapPassword] = useState('');

  // Forgot password fields
  const [forgotAccountName, setForgotAccountName] = useState('');
  const [forgotContact, setForgotContact] = useState('');
  const [forgotReason, setForgotReason] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Error feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = accountName.trim();
    const cleanPass = password.trim();

    if (cleanName.length < 3) {
      setErrorMessage('Account name must be at least 3 characters.');
      tacticalAudio.playAlertWarning();
      return;
    }
    if (cleanPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      tacticalAudio.playAlertWarning();
      return;
    }

    // Check existing registered accounts
    let accounts: any[] = [];
    try {
      const savedAcc = localStorage.getItem('ussf_registered_accounts');
      if (savedAcc) accounts = JSON.parse(savedAcc);
    } catch {}

    const alreadyTaken = accounts.some(a => (a.username || '').toLowerCase() === cleanName.toLowerCase()) ||
      members.some(m => (m.name || '').toLowerCase() === cleanName.toLowerCase());

    if (alreadyTaken) {
      setErrorMessage('An account with this username already exists. Please choose a different name.');
      tacticalAudio.playAlertWarning();
      return;
    }

    tacticalAudio.playTargetLock();

    // Create a pristine civilian account (NOT an active member, NOT in roster, 0 points, 0 service days)
    const newCivilian: USSFMember = {
      id: `usr-${Date.now()}`,
      cid: 'CIV-UNASSIGNED',
      name: cleanName,
      callsign: signupCallsign.trim() || 'Civilian',
      rank: 'Civilian / Unassigned',
      rankLevel: 0,
      rankCategory: 'Civilian / Applicant',
      division: 'Unassigned (Submit Application in Enlistment Center)',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Applicant',
      presenceStatus: 'Online',
      promotionPoints: 0,
      totalPayout: 0,
      arrestCount: 0,
      patrolHours: 0,
      playtimeHours: 0,
      serviceRibbons: [],
      avatarUrl: '/src/assets/images/military_leader_training_1790341999734.jpg',
      avatarFrame: 'Standard Issue Border',
      namecard: 'Basic Issue',
      nameStyle: 'standard',
      bio: 'Civilian account registered on website portal. Pending in-game account linking or enlistment.',
      signature: 'Applicant',
      customCursor: 'default',
      linkedInGame: false,
      isApplicant: true,
      isMember: false,
      isAdmin: false,
      isOwner: false,
      accountName: cleanName
    };

    const newRecord = {
      id: newCivilian.id,
      username: cleanName.toLowerCase(),
      password: cleanPass,
      user: newCivilian
    };

    accounts.push(newRecord);
    localStorage.setItem('ussf_registered_accounts', JSON.stringify(accounts));

    setAuthMode('login');
    setAccountName(cleanName);
    setPassword(cleanPass);
    setSignupSuccessMsg('Account registered successfully! Please log in below to access your civilian profile.');
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    tacticalAudio.playTacticalClick();
    const cleanName = accountName.trim();
    const cleanPass = password.trim();

    if (!cleanName || !cleanPass) {
      setErrorMessage('Please provide both account name and password.');
      tacticalAudio.playAlertWarning();
      return;
    }

    // 0. Administrator sign-in is validated by the server, which answers with an
    // HttpOnly session cookie used automatically by every protected admin request.
    if (cleanName.toLowerCase() === 'kamado' || cleanName.toLowerCase() === 'sf-001') {
      setErrorMessage(null);
      try {
        const adminMember = await api.loginAdmin(cleanName, cleanPass);
        const existingMember = members.find(m => m.id === adminMember.id || m.cid === adminMember.cid)
          || members.find(m => (m.name || '').toLowerCase() === 'kamado' || m.cid === 'SF-001');
        const activeAdminUser: USSFMember = {
          ...(existingMember || KAMADO_ADMIN_ACCOUNT),
          ...adminMember,
          rank: adminMember.rank || 'High Commander',
          rankLevel: adminMember.rankLevel || 20,
          isAdmin: true,
          isOwner: true,
          isMember: true,
          isApplicant: false,
          rankCategory: 'High Command',
          specialRoles: ['Administrator', 'Promotion Manager', 'Financial Manager', 'Account Recovery Manager']
        };

        tacticalAudio.playRadioSquelch();
        onLogin(activeAdminUser, keepMeLoggedIn);
        onClose();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Administrator sign-in failed. Please try again.');
        tacticalAudio.playAlertWarning();
      }
      return;
    }

    // 1. Check registered accounts in localStorage
    let accounts: any[] = [];
    try {
      const savedAcc = localStorage.getItem('ussf_registered_accounts');
      if (savedAcc) accounts = JSON.parse(savedAcc);
    } catch {}

    const matchedAccount = accounts.find(
      a => (a.username || '').toLowerCase() === cleanName.toLowerCase() ||
           (a.user?.cid || '').toLowerCase() === cleanName.toLowerCase()
    );

    if (matchedAccount) {
      if (matchedAccount.password !== cleanPass) {
        setErrorMessage('Invalid credentials. Password does not match.');
        tacticalAudio.playAlertWarning();
        return;
      }

      tacticalAudio.playRadioSquelch();
      onLogin(matchedAccount.user, keepMeLoggedIn);
      onClose();
      return;
    }

    // 2. Check active members in roster
    const matchedMember = members.find(
      m => (m.name || '').toLowerCase() === cleanName.toLowerCase() ||
           (m.cid || '').toLowerCase() === cleanName.toLowerCase()
    );

    if (matchedMember) {
      // Check stored password for this member
      let memberCreds: Record<string, string> = {};
      try {
        const saved = localStorage.getItem('ussf_member_passwords');
        if (saved) memberCreds = JSON.parse(saved);
      } catch {}

      const expectedPass = memberCreds[matchedMember.id] || memberCreds[matchedMember.name.toLowerCase()];
      if (expectedPass && expectedPass !== cleanPass) {
        setErrorMessage('Invalid credentials. Password does not match.');
        tacticalAudio.playAlertWarning();
        return;
      }

      tacticalAudio.playRadioSquelch();
      onLogin(matchedMember, keepMeLoggedIn);
      onClose();
      return;
    }

    // If neither matched:
    setErrorMessage('Account not found. Please verify your account name or sign up for a new account.');
    tacticalAudio.playAlertWarning();
  };

  const handleBootstrapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tacticalAudio.playTargetLock();
    if (!onOwnerBootstrap) {
      setErrorMessage('Bootstrap service not ready.');
      return;
    }
    const res = onOwnerBootstrap({
      ownerName: bootstrapOwnerName.trim(),
      cid: bootstrapCid.trim(),
      passphrase: bootstrapPassphrase.trim(),
      password: bootstrapPassword.trim()
    });
    if (!res.success) {
      setErrorMessage(res.message);
      tacticalAudio.playAlertWarning();
    } else {
      tacticalAudio.playRadioSquelch();
      onClose();
    }
  };

  const handleForgotPwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotAccountName.trim() || !forgotReason.trim()) {
      setErrorMessage('Please fill in your account name and explain what happened.');
      return;
    }

    tacticalAudio.playTargetLock();

    const req: ForgotPasswordRequest = {
      id: `fp-${Date.now()}`,
      accountName: forgotAccountName,
      emailOrContact: forgotContact || 'Not specified',
      reasonExplanation: forgotReason,
      requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Pending'
    };

    onSubmitForgotPw(req);
    setForgotSubmitted(true);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-700 bg-[#0d100d] p-6 shadow-2xl text-neutral-100 font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-5">
          <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-data text-amber-400 uppercase tracking-widest font-bold">
              MIL-SPEC ACCESS GATEWAY
            </div>
            <h3 className="text-base font-tactical font-black uppercase text-white">
              {authMode === 'login' && 'OPERATOR LOGIN'}
              {authMode === 'signup' && 'NEW OPERATOR SIGN UP'}
              {authMode === 'forgot' && 'PASSWORD RECOVERY PORTAL'}
              {authMode === 'bootstrap' && 'FIRST-TIME OWNER BOOTSTRAP'}
            </h3>
          </div>
        </div>

        {/* Mode Selector Tabs (Login / Sign Up / Owner Setup) */}
        {authMode !== 'forgot' && (
          <div className={`grid ${isBootstrapAvailable ? 'grid-cols-3' : 'grid-cols-2'} gap-2 p-1 bg-neutral-950 rounded-lg border border-neutral-800 mb-5 text-xs font-tactical`}>
            <button
              onClick={() => {
                tacticalAudio.playTacticalClick();
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded font-bold uppercase transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => {
                tacticalAudio.playTacticalClick();
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 rounded font-bold uppercase transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              SIGN UP
            </button>
            {isBootstrapAvailable && (
              <button
                onClick={() => {
                  tacticalAudio.playTacticalClick();
                  setAuthMode('bootstrap');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  authMode === 'bootstrap'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <span>OWNER SETUP</span>
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        {signupSuccessMsg && (
          <div className="mb-4 p-3 rounded-lg border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 text-xs font-data flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{signupSuccessMsg}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg border border-rose-500/50 bg-rose-950/40 text-rose-300 text-xs font-data flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-data">
            <div>
              <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                ACCOUNT NAME / CID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Ghost or SF-001"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                />
                <User className="absolute right-3 top-2.5 h-4 w-4 text-neutral-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-neutral-400 uppercase text-[10px]">
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playTacticalClick();
                    setAuthMode('forgot');
                    setForgotAccountName(accountName);
                    setErrorMessage(null);
                  }}
                  className="text-amber-400 hover:underline text-[10px] uppercase font-bold"
                >
                  FORGOT PASSWORD?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Keep me logged in checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={keepMeLoggedIn}
                  onChange={(e) => setKeepMeLoggedIn(e.target.checked)}
                  className="h-4 w-4 accent-amber-500 cursor-pointer"
                />
                <span className="text-[11px]">Keep me logged in on this device</span>
              </label>

              <span className="text-[10px] text-emerald-400 font-bold uppercase">
                PERSISTENT SESSION
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-tactical font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-1.5"
            >
              <span>ACCESS COMMAND DECK</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* 2. SIGN UP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4 text-xs font-data">
            <div>
              <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                DESIRED ACCOUNT NAME *
              </label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Choose your account name"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                CREATE SECURE PASSWORD *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                TACTICAL CALLSIGN (OPTIONAL)
              </label>
              <input
                type="text"
                value={signupCallsign}
                onChange={(e) => setSignupCallsign(e.target.value)}
                placeholder="e.g. Apex-1, Ghost-9"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400">
              Upon successful registration, you will be redirected to login automatically with your credentials prefilled.
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-tactical font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg mt-2"
            >
              CREATE SPECIAL FORCES ACCOUNT
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD RECOVERY REQUEST */}
        {authMode === 'forgot' && (
          <div className="space-y-4">
            {forgotSubmitted ? (
              <div className="p-6 rounded-xl border border-emerald-500/50 bg-emerald-950/40 text-center space-y-3 animate-in zoom-in">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-tactical uppercase font-bold text-white">
                  RECOVERY REQUEST TRANSMITTED TO ADMINS
                </h4>
                <p className="text-xs text-neutral-300">
                  Only Admins can see this forgot password request. High Command will review your explanation and issue an approved recovery key.
                </p>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setForgotSubmitted(false);
                  }}
                  className="mt-2 text-xs font-data px-4 py-1.5 rounded bg-amber-500 text-neutral-950 font-bold"
                >
                  RETURN TO LOGIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPwSubmit} className="space-y-3.5 text-xs font-data">
                <div className="p-3 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300">
                  <span className="text-amber-400 font-bold block uppercase mb-1">
                    ADMIN-RESTRICTED PASSWORD RECOVERY
                  </span>
                  Please state your account name and explain what happened and how you lost access. Admins will review your request directly in the Admin Panel.
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                    ACCOUNT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotAccountName}
                    onChange={(e) => setForgotAccountName(e.target.value)}
                    placeholder="Exact account username"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                    DISCORD / EMAIL CONTACT FOR VERIFICATION
                  </label>
                  <input
                    type="text"
                    value={forgotContact}
                    onChange={(e) => setForgotContact(e.target.value)}
                    placeholder="e.g. operator#0001 or name@email.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                    EXPLANATION OF WHAT HAPPENED & HOW YOU LOST IT *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={forgotReason}
                    onChange={(e) => setForgotReason(e.target.value)}
                    placeholder="Detail how credentials were lost (e.g. reinstalled system, forgotten password)..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-100 font-sans resize-none focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    ← Back to Login
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-tactical font-black text-xs uppercase cursor-pointer"
                  >
                    SUBMIT TO ADMIN QUEUE
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 4. FIRST-TIME OWNER BOOTSTRAP FORM */}
        {authMode === 'bootstrap' && isBootstrapAvailable && (
          <form onSubmit={handleBootstrapSubmit} className="space-y-3.5 text-xs font-data">
            <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-300 text-[11px] leading-relaxed">
              <span className="font-bold uppercase block text-rose-200 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-rose-400" />
                <span>FIRST-TIME OWNER BOOTSTRAP INITIALIZATION</span>
              </span>
              This portal operates strictly once when zero administrators exist. Enter the master bootstrap passphrase to initialize the legitimate founding High Commander.
            </div>

            <div>
              <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                MASTER BOOTSTRAP PASSPHRASE *
              </label>
              <input
                type="password"
                required
                value={bootstrapPassphrase}
                onChange={(e) => setBootstrapPassphrase(e.target.value)}
                placeholder="Enter master authorization key..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                FOUNDER HIGH COMMANDER NAME *
              </label>
              <input
                type="text"
                required
                value={bootstrapOwnerName}
                onChange={(e) => setBootstrapOwnerName(e.target.value)}
                placeholder="e.g. HighCommander"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                IN-GAME CID *
              </label>
              <input
                type="text"
                required
                value={bootstrapCid}
                onChange={(e) => setBootstrapCid(e.target.value)}
                placeholder="e.g. SF-001"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-400 uppercase text-[10px] mb-1">
                OWNER ADMIN PASSWORD *
              </label>
              <input
                type="password"
                required
                value={bootstrapPassword}
                onChange={(e) => setBootstrapPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-tactical font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>INITIALIZE LEGITIMATE OWNER ACCOUNT</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
