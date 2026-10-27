import React from 'react';
import { 
  Shield, Award, Users, Flag, Crosshair, CheckCircle2, 
  Car, UserCheck, Calendar, BookOpen, AlertCircle, Sparkles
} from 'lucide-react';
import { USSF_GROUP_INFO } from '../data/ussfData';
import { tacticalAudio } from '../utils/audioSynth';
import { USSFView } from './USSFHeader';

interface USSFGroupInfoViewProps {
  onNavigate: (view: USSFView) => void;
  groupInfo?: typeof USSF_GROUP_INFO;
}

export const USSFGroupInfoView: React.FC<USSFGroupInfoViewProps> = ({
  onNavigate,
  groupInfo
}) => {
  // Admin studio edits are published through state.groupInfo; fall back to the
  // static defaults for fields never edited.
  const info = { ...USSF_GROUP_INFO, ...(groupInfo || {}) };
  return (
    <div className="w-full bg-[#080a08] text-neutral-100 min-h-screen pb-16 font-sans">
      {/* High-Impact Clear Visible Headquarters Banner */}
      <div className="relative w-full overflow-hidden border-b border-neutral-800 bg-[#0c100c] min-h-[380px] flex items-center">
        {/* Background Image - Clean Visibility with subtle gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/ussf_command_center_1790425156554.jpg"
            alt="USSF Headquarters Command Center"
            className="h-full w-full object-cover object-center filter brightness-90 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080a08] via-[#080a08]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080a08] via-[#080a08]/75 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-wrap items-center gap-2 text-xs font-data uppercase tracking-widest text-amber-400 mb-2">
            <Shield className="h-4 w-4" />
            <span>ORGANIZATION SPECIFICATIONS // {info.level} POLICE FORCE GROUP</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-tactical uppercase tracking-tight text-white drop-shadow-lg">
            {info.name}
          </h1>

          <div className="border-l-2 border-amber-500 pl-4 py-2 mt-4 max-w-2xl bg-black/60 backdrop-blur rounded-r">
            <p className="text-base sm:text-lg font-sans italic font-bold text-amber-400">
              "{info.motto}"
            </p>
            <p className="text-xs font-data text-neutral-400 uppercase mt-1">
              Active Since: {info.activeSince} · CIT2 Law Enforcement Police Force Group
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Organization Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-data text-xs">
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-2">
            <span className="text-neutral-500 uppercase text-[10px] block">ORGANIZATION NAME & LEVEL</span>
            <div className="text-lg font-tactical font-black text-white">{info.name}</div>
            <div className="text-emerald-400 font-bold">Group Level: {info.level}</div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-2">
            <span className="text-neutral-500 uppercase text-[10px] block">FOUNDER & CO-FOUNDER</span>
            <div className="text-neutral-200 font-bold">{info.founder}</div>
            <div className="text-neutral-300 font-semibold">{info.coFounder}</div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-2">
            <span className="text-neutral-500 uppercase text-[10px] block">GROUP LEADERSHIP STAFF</span>
            <div className="text-amber-400 font-bold">{info.leaders}</div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-2">
            <span className="text-neutral-500 uppercase text-[10px] block">TAG USAGE & ALLIANCE</span>
            <div className="text-neutral-200 font-bold">Standard Tag: <span className="text-cyan-400">{info.tagUsage}</span></div>
            <div className="text-neutral-400">Alliance: {info.alliance}</div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-2">
            <span className="text-neutral-500 uppercase text-[10px] block">ORGANIZATION COLOR & HEX</span>
            <div className="text-neutral-200 font-bold">{info.organizationColor}</div>
            <div className="text-amber-400 font-bold">Hex: {info.hexColor} (Pure Tactical Black)</div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-2">
            <span className="text-neutral-500 uppercase text-[10px] block">COMMAND CENTERS</span>
            <div className="text-neutral-200 font-bold">{info.commandCenters}</div>
            <div className="text-emerald-400">Operating in LS + LV (Ground, Sea, Air)</div>
          </div>
        </div>

        {/* Skins & Car Shaders Available */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-data text-xs">
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase border-b border-neutral-800 pb-2">
              <UserCheck className="h-4 w-4" />
              <span>OFFICIAL SKINS AVAILABLE ({info.skinsAvailable.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {info.skinsAvailable.map(skin => (
                <span key={skin} className="px-3 py-1 rounded bg-neutral-950 border border-neutral-700 text-neutral-200 font-mono">
                  Skin ID: {skin}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/70 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase border-b border-neutral-800 pb-2">
              <Car className="h-4 w-4" />
              <span>CUSTOM CAR SHADERS AVAILABLE</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {info.carShadersAvailable.map(car => (
                <span key={car} className="px-3 py-1 rounded bg-neutral-950 border border-neutral-700 text-emerald-300 font-mono font-bold">
                  {car}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Complete Group History & Doctrinal Missions (Exact copy from prompt) */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 space-y-6 text-sm text-neutral-300 leading-relaxed font-sans">
          <div className="flex items-center gap-2 text-xs font-data uppercase tracking-wider text-amber-400 font-bold border-b border-neutral-800 pb-3">
            <BookOpen className="h-4 w-4" />
            <span>ORGANIZATIONAL HISTORY & CHARTER</span>
          </div>

          <div className="space-y-4">
            <p>
              <strong className="text-white">Special Forces</strong> was established on June 30, 2019. We are a police force group. We care about CIT and the community and bring benefits as possible. USSF is always active in the field of arresting criminals in any form of crime. In addition, USSF always maintains the best state and is ready to face situations that may arise and bring order to CIT in general, we are group law, and we are willing to dedicate and develop to bring the importance of USSF in CIT and San Andreas in general. All of our fields are absolutely strict with members, and one more thing, members always respect the collective rules of CIT and USSF.
            </p>

            <p>
              Special Forces are designed to deploy and execute nine doctrinal missions: <span className="text-amber-300 font-semibold">unconventional warfare, foreign internal defense, direct action, counter-insurgency, special reconnaissance, counter-terrorism, information operations, counterproliferation of weapon of mass destruction, and security force assistance</span>.
            </p>

            <p>
              Other duties include <span className="text-emerald-300 font-semibold">combat search and rescue (CSAR), counter-narcotics, hostage rescue, humanitarian assistance, humanitarian demining, information operations, peacekeeping, psychological operations, and manhunts</span>.
            </p>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs font-data">
              ⚡ USSF is very strict about its operators' combat skills and behavior, and usually only 10% of applicants can pass all tests and become an Official Operator. In addition to Law, USSF has its own medics and field specialists.
            </div>

            <p>
              We aim to train active, mature, and professional operators. We are also trying hard to keep our <em className="text-white">Quality</em> as high as possible. Meanwhile, we do our best to unite the lawside by doing teamwork and inspiring new cops to work as a team. We do really want to make a united lawside, and at the same time, we follow Ingame + Forum rules and obligate our members to do the same.
            </p>

            <p>
              Being active in <strong className="text-white">LS + LV (Ground, Sea, Air)</strong> as law enforcement and as medics, also fighting rebels at the same time. Providing a friendly, guarded, and positive atmosphere for everyone so they can enjoy without disrupting other community members' game.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
