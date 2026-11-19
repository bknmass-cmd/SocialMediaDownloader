import React from 'react';
import { HardDrive, Smartphone, Monitor } from 'lucide-react';
import { StorageStats } from '../types';

interface HeaderProps {
  stats: StorageStats;
  activeTab: 'extract' | 'storage' | 'apk';
  setActiveTab: (tab: 'extract' | 'storage' | 'apk') => void;
  isPhoneFrame: boolean;
  setIsPhoneFrame: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  activeTab,
  setActiveTab,
  isPhoneFrame,
  setIsPhoneFrame,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* App Title & Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('extract')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                SnapVault
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO APK
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Instagram • Twitter (X) • Threads
            </p>
          </div>
        </div>

        {/* Right side: Phone Frame Toggle & Storage Counter */}
        <div className="flex items-center gap-2">
          {/* Storage shortcut */}
          <button
            onClick={() => setActiveTab('storage')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === 'storage'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Folder ({stats.totalItems})</span>
          </button>

          {/* Phone Frame Toggle (for testing mobile view vs desktop) */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            title={isPhoneFrame ? 'Switch to Full Width Desktop' : 'Switch to Android Phone Preview'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
          >
            {isPhoneFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Full View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Phone Frame</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
