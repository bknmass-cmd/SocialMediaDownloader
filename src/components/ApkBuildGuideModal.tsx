import React, { useState } from 'react';
import { Smartphone, Terminal, Check, Copy, ShieldCheck, FolderGit2, ArrowRight, Download } from 'lucide-react';

export const ApkBuildGuideModal: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const steps = [
    {
      title: '1. Build Web Assets',
      desc: 'Compile production React + Vite bundle into dist/',
      cmd: 'npm.cmd run build',
    },
    {
      title: '2. Initialize & Sync Android Platform',
      desc: 'Add Android native scaffold with Capacitor and sync web assets',
      cmd: 'npx.cmd cap add android\nnpx.cmd cap sync android',
    },
    {
      title: '3. Build Debug APK via Gradle',
      desc: 'Run Gradle to assemble the installable .apk package',
      cmd: 'cd android\n.\\gradlew.bat assembleDebug',
      output: 'Output file: android/app/build/outputs/apk/debug/app-debug.apk'
    },
    {
      title: '4. Or Open in Android Studio',
      desc: 'Directly edit, sign, test on connected USB phone or emulator',
      cmd: 'npx.cmd cap open android',
    }
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">
                Android APK Generation Guide
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ready for Packaging
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Configured with App ID <code className="text-purple-300 font-mono text-[11px]">com.snapvault.mediasaver</code>
            </p>
          </div>
        </div>

        {/* Permissions & Features Pill */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-500/20 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Scoped Storage Permissions enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Auto creates <code className="text-white font-mono">SnapVault/images & videos</code></span>
          </div>
        </div>
      </div>

      {/* Step by Step Execution Instructions */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-mono">
                    {idx + 1}
                  </span>
                  <span>{step.title}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 pl-6">
                  {step.desc}
                </p>
              </div>

              <button
                onClick={() => handleCopy(step.cmd, idx)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors shrink-0"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Box */}
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-purple-300 border border-slate-800/80 overflow-x-auto whitespace-pre">
              {step.cmd}
            </div>

            {step.output && (
              <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2">
                {step.output}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Installation Instructions */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
        <h4 className="font-bold text-white flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          <span>How to install on your Android Phone:</span>
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] pl-1">
          <li>Send the generated <code className="text-purple-300 font-mono">app-debug.apk</code> to your phone (via USB cable, WhatsApp, or Google Drive).</li>
          <li>Tap the file on your phone and choose <strong>"Install"</strong>.</li>
          <li>If prompted, allow <em>"Install unknown apps from this source"</em>.</li>
          <li>Launch <strong>SnapVault</strong>: It automatically creates the <code className="text-slate-200">SnapVault/images</code> and <code className="text-slate-200">SnapVault/videos</code> folders.</li>
          <li>Enjoy extracting high-speed images and videos with audio!</li>
        </ol>
      </div>
    </div>
  );
};
