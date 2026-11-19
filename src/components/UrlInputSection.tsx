import React from 'react';
import { Clipboard, X, Search, Check, Link, Sparkles } from 'lucide-react';
import { Platform } from '../types';

interface UrlInputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  selectedPlatform: Platform | 'all';
  setSelectedPlatform: (p: Platform | 'all') => void;
  detectedPlatform: Platform | null;
  isLoading: boolean;
  onFetch: (customUrl?: string) => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  url,
  setUrl,
  selectedPlatform,
  setSelectedPlatform,
  detectedPlatform,
  isLoading,
  onFetch,
}) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const clean = text.trim();
        setUrl(clean);
        onFetch(clean);
      }
    } catch {
      const input = document.getElementById('url-input') as HTMLInputElement;
      if (input) input.focus();
    }
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.trim()) {
      const clean = pastedText.trim();
      setUrl(clean);
      onFetch(clean);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onFetch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Platform Selector Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80 w-full sm:w-auto">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedPlatform === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Platforms
          </button>

          {/* Instagram */}
          <button
            onClick={() => setSelectedPlatform('instagram')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedPlatform === 'instagram'
                ? 'bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 text-white shadow-md shadow-pink-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            Instagram
          </button>

          {/* Twitter / X */}
          <button
            onClick={() => setSelectedPlatform('twitter')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedPlatform === 'twitter'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            Twitter / X
          </button>

          {/* Threads */}
          <button
            onClick={() => setSelectedPlatform('threads')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedPlatform === 'threads'
                ? 'bg-slate-100 text-slate-950 shadow-md shadow-white/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Threads
          </button>
        </div>
      </div>

      {/* Main Input Box */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500 rounded-3xl opacity-30 group-hover:opacity-50 blur transition duration-300"></div>

        <div className="relative bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl">
          <div className="flex items-center gap-2">
            {/* Input field */}
            <div className="relative flex-1">
              <input
                id="url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handleInputPaste}
                onKeyDown={handleKeyDown}
                placeholder="Paste Instagram, Twitter/X, Threads link (or direct image/video URL)..."
                className="w-full bg-transparent pl-3 pr-8 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
              />

              {/* Detected platform indicator badge */}
              {detectedPlatform && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="capitalize">{detectedPlatform}</span>
                </div>
              )}

              {/* Clear button */}
              {url && !detectedPlatform && (
                <button
                  onClick={() => setUrl('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Paste from clipboard button */}
            <button
              onClick={handlePaste}
              title="Paste from clipboard"
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors shrink-0"
            >
              <Clipboard className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Paste</span>
            </button>

            {/* Fetch Media button */}
            <button
              onClick={() => onFetch()}
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Fetch Media</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic format guidance bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5 text-purple-400" />
          <span>Dynamic input: Supports single/multi links, reels with audio & carousels</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono">Live Extraction Ready</span>
      </div>
    </div>
  );
};
