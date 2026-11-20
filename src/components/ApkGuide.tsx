import React, { useState } from 'react';
import { Smartphone, Check, Copy, ShieldCheck, FolderGit2 } from 'lucide-react';

export const ApkGuide: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border border-purple-500/30 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">Android APK Builder</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ready to Package
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              App ID: <code className="text-purple-300 font-mono">com.snapvault.mediasaver</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-500/20 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Scoped Storage Permissions enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Auto-creates <code className="text-white font-mono">SnapVault/images & videos</code></span>
          </div>
        </div>
      </div>

      {/* 1-Click Batch Build */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white">1. One-Click Build Script</h3>
          <button
            onClick={() => copyToClipboard('.\\build-apk.bat', 'cmd1')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300"
          >
            {copied === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'cmd1' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-400">Run this in your project terminal to compile and package the debug APK:</p>
        <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-purple-300 border border-slate-800">
          .\build-apk.bat
        </div>
      </div>

      {/* Android Studio Option */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white">2. Open in Android Studio</h3>
          <button
            onClick={() => copyToClipboard('npm run build\nnpx cap sync android\nnpx cap open android', 'cmd2')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300"
          >
            {copied === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'cmd2' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-purple-300 border border-slate-800 whitespace-pre">
          {'npm run build\nnpx cap sync android\nnpx cap open android'}
        </div>
      </div>

      {/* Phone Install Instructions */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
        <h4 className="font-bold text-white">Installation on Phone:</h4>
        <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
          <li>Transfer the generated <code className="text-purple-300 font-mono">SnapVault-debug.apk</code> to your phone.</li>
          <li>Tap the file and select <strong>Install</strong>.</li>
          <li>Open <strong>SnapVault</strong>: It automatically initializes <code className="text-white">SnapVault/images</code> and <code className="text-white">SnapVault/videos</code>.</li>
        </ol>
      </div>
    </div>
  );
};
