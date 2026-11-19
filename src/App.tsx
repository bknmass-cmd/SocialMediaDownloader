import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  HardDrive,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Link2,
  Sparkles,
  Layers,
  ArrowDownCircle
} from 'lucide-react';
import { ExtractedPost, Platform, SavedMediaItem, StorageStats, MediaItem } from './types';
import { ExtractorService } from './services/extractorService';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { UrlInputSection } from './components/UrlInputSection';
import { MediaResultCard } from './components/MediaResultCard';
import { MultiImageSelector } from './components/MultiImageSelector';
import { VideoPlayerWithAudioControl } from './components/VideoPlayerWithAudioControl';
import { PhoneFolderExplorer } from './components/PhoneFolderExplorer';
import { ApkBuildGuideModal } from './components/ApkBuildGuideModal';

export const App: React.FC = () => {
  // Navigation & Frame Mode
  const [activeTab, setActiveTab] = useState<'extract' | 'storage' | 'apk'>('extract');
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // Extractor State - starts clean with NO static data
  const [url, setUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedPost, setExtractedPost] = useState<ExtractedPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Storage State - starts with real files only
  const [savedItems, setSavedItems] = useState<SavedMediaItem[]>([]);
  const [stats, setStats] = useState<StorageStats>({
    totalItems: 0,
    totalImages: 0,
    totalVideos: 0,
    totalSizeBytes: 0
  });

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize storage folders and load items
  useEffect(() => {
    StorageService.initAppFolders();
    refreshSavedMedia();
    // No static default image loaded - user must paste a URL to see dynamic data
  }, []);

  // Detect platform as user types/pastes
  useEffect(() => {
    if (url.trim()) {
      const detected = ExtractorService.detectPlatform(url);
      setDetectedPlatform(detected);
    } else {
      setDetectedPlatform(null);
    }
  }, [url]);

  const refreshSavedMedia = () => {
    const items = StorageService.getSavedMedia();
    setSavedItems(items);
    setStats(StorageService.getStorageStats());
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fireCelebration = () => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981']
      });
    } catch {
      // Ignore if confetti blocked
    }
  };

  const handleFetch = async (customUrl?: string) => {
    const targetUrl = customUrl || url;
    if (!targetUrl.trim()) {
      setError('Please paste a link first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hint = selectedPlatform !== 'all' ? selectedPlatform : undefined;
      const result = await ExtractorService.extractMedia(targetUrl, hint);
      setExtractedPost(result);
      showToast(`Extracted ${result.media.length} dynamic ${result.media.length > 1 ? 'items' : 'item'} from ${result.platform}!`);
    } catch (err: any) {
      setError(err?.message || 'Failed to extract media. Please check URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Batch or Single Image Save
  const handleSaveImages = async (items: MediaItem[], indices: number[]) => {
    if (!extractedPost) return;
    setIsSaving(true);

    try {
      for (let i = 0; i < items.length; i++) {
        await StorageService.saveItem(items[i], extractedPost, indices[i]);
      }
      refreshSavedMedia();
      fireCelebration();
      showToast(`Saved ${items.length} photo${items.length > 1 ? 's' : ''} to SnapVault/images/!`);
    } catch (e: any) {
      showToast('Error saving images: ' + e?.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Video Save
  const handleSaveVideo = async (item: MediaItem) => {
    if (!extractedPost) return;
    setIsSaving(true);

    try {
      await StorageService.saveItem(item, extractedPost);
      refreshSavedMedia();
      fireCelebration();
      showToast('Saved video to SnapVault/videos/!');
    } catch (e: any) {
      showToast('Error saving video: ' + e?.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved item
  const handleDeleteItem = (id: string) => {
    const updated = StorageService.deleteItem(id);
    setSavedItems(updated);
    setStats(StorageService.getStorageStats());
    showToast('File removed from folder.');
  };

  // Clear folder
  const handleClearFolder = (folder?: 'images' | 'videos') => {
    const updated = StorageService.clearFolder(folder);
    setSavedItems(updated);
    setStats(StorageService.getStorageStats());
    showToast(`Cleared ${folder || 'all'} files.`);
  };

  const mainContent = (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('extract')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'extract'
              ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Extractor</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'storage'
              ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>SnapVault Folders ({stats.totalItems})</span>
        </button>

        <button
          onClick={() => setActiveTab('apk')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'apk'
              ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Build APK</span>
        </button>
      </div>

      {/* View 1: Extractor / Downloader */}
      {activeTab === 'extract' && (
        <div className="space-y-6">
          {/* URL Input Form */}
          <UrlInputSection
            url={url}
            setUrl={setUrl}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            detectedPlatform={detectedPlatform}
            isLoading={isLoading}
            onFetch={handleFetch}
          />

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Extracted Dynamic Post Result Card */}
          {extractedPost ? (
            <MediaResultCard post={extractedPost}>
              {extractedPost.hasVideo ? (
                <VideoPlayerWithAudioControl
                  mediaItem={extractedPost.media[0]}
                  post={extractedPost}
                  onSaveVideo={handleSaveVideo}
                  isSaving={isSaving}
                />
              ) : (
                <MultiImageSelector
                  post={extractedPost}
                  onSaveItems={handleSaveImages}
                  isSaving={isSaving}
                />
              )}
            </MediaResultCard>
          ) : (
            /* Clean Empty State when no URL is pasted yet */
            !isLoading && !error && (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex items-center justify-center mx-auto shadow-inner">
                  <Link2 className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base font-extrabold text-white">
                    Paste a URL to View Dynamic Media
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Paste any Instagram reel, multi-image carousel, Twitter/X photo/video, Threads post, or direct media URL above.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-pink-500/10 text-pink-300 border border-pink-500/20">
                    📸 Instagram Carousel & Reels
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    🐦 Twitter / X Media
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    🧵 Threads Posts
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* View 2: Phone Folders Storage Explorer */}
      {activeTab === 'storage' && (
        <PhoneFolderExplorer
          savedItems={savedItems}
          stats={stats}
          onDeleteItem={handleDeleteItem}
          onClearFolder={handleClearFolder}
        />
      )}

      {/* View 3: APK Build Guide */}
      {activeTab === 'apk' && <ApkBuildGuideModal />}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <Header
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPhoneFrame={isPhoneFrame}
        setIsPhoneFrame={setIsPhoneFrame}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {isPhoneFrame ? (
          /* Android Smartphone Frame Simulation */
          <div className="max-w-[412px] mx-auto rounded-[48px] p-3 bg-gradient-to-b from-slate-800 to-slate-900 shadow-[0_0_60px_rgba(139,92,246,0.18)] border-4 border-slate-700">
            {/* Phone Screen */}
            <div className="bg-slate-950 rounded-[40px] overflow-hidden min-h-[780px] p-4 flex flex-col border border-slate-800/80">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-3 pt-1 pb-3">
                <span>9:41</span>
                {/* Camera punch hole */}
                <div className="w-3.5 h-3.5 rounded-full bg-black ring-2 ring-slate-800"></div>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Scrollable Content inside Phone Screen */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {mainContent}
              </div>

              {/* Android Navigation Bar Pill */}
              <div className="pt-3 pb-1 flex justify-center">
                <div className="w-32 h-1 rounded-full bg-slate-700"></div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Responsive Layout */
          mainContent
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        <p>SnapVault • Universal Dynamic Social Media Saver (Instagram, Twitter / X, Threads)</p>
      </footer>
    </div>
  );
};

export default App;
