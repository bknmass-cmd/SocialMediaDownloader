import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, CheckCircle2, Link2 } from 'lucide-react';
import { ExtractedMedia, Platform, SavedMediaItem, StorageStats, MediaItem } from './types';
import { ExtractorService } from './services/extractor';
import { StorageService } from './services/storage';
import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { MediaDisplay } from './components/MediaDisplay';
import { FolderExplorer } from './components/FolderExplorer';
import { ApkGuide } from './components/ApkGuide';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'download' | 'folder' | 'apk'>('download');
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('direct');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedMedia, setExtractedMedia] = useState<ExtractedMedia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Storage
  const [savedItems, setSavedItems] = useState<SavedMediaItem[]>([]);
  const [stats, setStats] = useState<StorageStats>({
    totalItems: 0,
    totalImages: 0,
    totalVideos: 0,
    totalSizeBytes: 0
  });

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    StorageService.initAppFolders();
    refreshStorage();
  }, []);

  useEffect(() => {
    if (url.trim()) {
      setDetectedPlatform(ExtractorService.detectPlatform(url));
    } else {
      setDetectedPlatform('direct');
    }
  }, [url]);

  const refreshStorage = () => {
    setSavedItems(StorageService.getSavedMedia());
    setStats(StorageService.getStorageStats());
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981']
      });
    } catch {}
  };

  const handleFetch = async (targetUrl?: string) => {
    const toFetch = (targetUrl || url).trim();
    if (!toFetch) {
      setError('Please enter or paste a valid link first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await ExtractorService.extract(toFetch);
      setExtractedMedia(result);
      showToast(`Found ${result.items.length} media file${result.items.length > 1 ? 's' : ''}!`);
    } catch (err: any) {
      setError(err?.message || 'Failed to extract media from this URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItems = async (items: MediaItem[], indices?: number[]) => {
    if (!extractedMedia) return;
    setIsSaving(true);

    try {
      for (let i = 0; i < items.length; i++) {
        await StorageService.saveItem(items[i], extractedMedia.platform, indices ? indices[i] : undefined);
      }
      refreshStorage();
      fireConfetti();
      const isVid = items[0].type === 'video';
      showToast(`Saved to SnapVault/${isVid ? 'videos' : 'images'}/!`);
    } catch (e: any) {
      showToast('Save failed: ' + e?.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setSavedItems(StorageService.deleteItem(id));
    setStats(StorageService.getStorageStats());
    showToast('File removed.');
  };

  const handleClearStorage = (folder?: 'images' | 'videos') => {
    setSavedItems(StorageService.clearStorage(folder));
    setStats(StorageService.getStorageStats());
    showToast(`Cleared ${folder || 'all'} files.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header stats={stats} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab 1: Downloader */}
        {activeTab === 'download' && (
          <div className="space-y-6">
            <UrlInput
              url={url}
              setUrl={setUrl}
              detectedPlatform={detectedPlatform}
              isLoading={isLoading}
              onFetch={handleFetch}
            />

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {extractedMedia ? (
              <MediaDisplay
                media={extractedMedia}
                onSaveItems={handleSaveItems}
                isSaving={isSaving}
              />
            ) : (
              !isLoading && (
                <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
                    <Link2 className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    Paste Any Media URL Above
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Paste Instagram posts/reels, Twitter/X images/videos, Threads posts, or direct media links.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* Tab 2: SnapVault Phone Folder Explorer */}
        {activeTab === 'folder' && (
          <FolderExplorer
            savedItems={savedItems}
            stats={stats}
            onDeleteItem={handleDeleteItem}
            onClearStorage={handleClearStorage}
          />
        )}

        {/* Tab 3: APK Build Guide */}
        {activeTab === 'apk' && <ApkGuide />}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border text-xs font-bold ${
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
    </div>
  );
};

export default App;
