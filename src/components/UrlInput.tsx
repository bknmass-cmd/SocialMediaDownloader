import React from 'react';
import { Clipboard, X, Search, Check } from 'lucide-react';
import { Platform } from '../types';

interface UrlInputProps {
  url: string;
  setUrl: (val: string) => void;
  detectedPlatform: Platform;
  isLoading: boolean;
  onFetch: (customUrl?: string) => void;
}

export const UrlInput: React.FC<UrlInputProps> = ({
  url,
  setUrl,
  detectedPlatform,
  isLoading,
  onFetch,
}) => {
  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const clean = text.trim();
        setUrl(clean);
        onFetch(clean);
      }
    } catch {
      const input = document.getElementById('media-url-input') as HTMLInputElement;
      if (input) input.focus();
    }
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text && text.trim()) {
      const clean = text.trim();
      setUrl(clean);
      onFetch(clean);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onFetch();
    }
  };

  const getPlatformLabel = () => {
    switch (detectedPlatform) {
      case 'instagram': return 'Instagram';
      case 'twitter': return 'Twitter / X';
      case 'threads': return 'Threads';
      default: return 'Direct URL';
    }
  };

  return (
    <div className="space-y-3">
      {/* Platform Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
        <span className="text-slate-400">Supported:</span>
        <span className="px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
          📸 Instagram
        </span>
        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
          🐦 Twitter / X
        </span>
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          🧵 Threads
        </span>
      </div>

      {/* Main Input Bar */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500 rounded-2xl opacity-40 group-hover:opacity-60 blur transition duration-200"></div>

        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="media-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPaste={handleInputPaste}
              onKeyDown={handleKeyDown}
              placeholder="Paste Instagram, Twitter/X, Threads, or direct image/video URL..."
              className="w-full bg-transparent pl-3 pr-8 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
            />

            {detectedPlatform !== 'direct' && url && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                <Check className="w-2.5 h-2.5 text-emerald-400" />
                <span>{getPlatformLabel()}</span>
              </div>
            )}

            {url && detectedPlatform === 'direct' && (
              <button
                onClick={() => setUrl('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handlePasteClick}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
          >
            <Clipboard className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Paste</span>
          </button>

          <button
            onClick={() => onFetch()}
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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
  );
};
