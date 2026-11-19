import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Trash2,
  ExternalLink,
  HardDrive,
  CheckCircle,
  Play,
  X
} from 'lucide-react';
import { SavedMediaItem, StorageStats } from '../types';
import { StorageService } from '../services/storageService';

interface PhoneFolderExplorerProps {
  savedItems: SavedMediaItem[];
  stats: StorageStats;
  onDeleteItem: (id: string) => void;
  onClearFolder: (folder?: 'images' | 'videos') => void;
}

export const PhoneFolderExplorer: React.FC<PhoneFolderExplorerProps> = ({
  savedItems,
  stats,
  onDeleteItem,
  onClearFolder,
}) => {
  const [activeFolderTab, setActiveFolderTab] = useState<'all' | 'images' | 'videos'>('all');
  const [previewItem, setPreviewItem] = useState<SavedMediaItem | null>(null);

  const filteredItems = savedItems.filter(item => {
    if (activeFolderTab === 'images') return item.folder === 'images';
    if (activeFolderTab === 'videos') return item.folder === 'videos';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Phone Storage Architecture Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Phone Storage Directory
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                /storage/emulated/0/Documents/SnapVault/
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-200">
              {StorageService.formatBytes(stats.totalSizeBytes)}
            </span>
            <p className="text-[10px] text-slate-500">
              {stats.totalItems} files saved
            </p>
          </div>
        </div>

        {/* Visual Folder Hierarchy Tree */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <FolderOpen className="w-4 h-4 text-purple-400 shrink-0" />
            <span>SnapVault/</span>
            <span className="text-[10px] text-slate-400 font-sans font-normal ml-auto">
              Root App Directory
            </span>
          </div>

          <div className="pl-5 space-y-1.5 border-l-2 border-slate-800 ml-2">
            {/* images subfolder */}
            <div
              onClick={() => setActiveFolderTab('images')}
              className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                activeFolderTab === 'images'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>├── images/</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-sans">
                {stats.totalImages} photos
              </span>
            </div>

            {/* videos subfolder */}
            <div
              onClick={() => setActiveFolderTab('videos')}
              className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                activeFolderTab === 'videos'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>└── videos/</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-sans">
                {stats.totalVideos} videos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveFolderTab('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeFolderTab === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Files ({stats.totalItems})
          </button>
          <button
            onClick={() => setActiveFolderTab('images')}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeFolderTab === 'images'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>images/ ({stats.totalImages})</span>
          </button>
          <button
            onClick={() => setActiveFolderTab('videos')}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeFolderTab === 'videos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3 h-3" />
            <span>videos/ ({stats.totalVideos})</span>
          </button>
        </div>

        {savedItems.length > 0 && (
          <button
            onClick={() => onClearFolder(activeFolderTab === 'all' ? undefined : activeFolderTab)}
            className="text-[11px] text-rose-400 hover:text-rose-300 p-1 font-medium transition-colors"
          >
            Clear {activeFolderTab}
          </button>
        )}
      </div>

      {/* Files Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
          <Folder className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">
            No files in {activeFolderTab === 'all' ? 'SnapVault' : `SnapVault/${activeFolderTab}`} yet
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Paste an Instagram, Twitter/X, or Threads URL in the downloader tab to save media directly into this folder!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredItems.map(item => {
            const isVideo = item.fileType === 'video';

            return (
              <div
                key={item.id}
                className="group p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex gap-3 items-center"
              >
                {/* Media Thumbnail */}
                <div
                  onClick={() => setPreviewItem(item)}
                  className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 cursor-pointer border border-slate-800 group-hover:border-purple-500/50 transition-colors"
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.fileName}
                    className="w-full h-full object-cover"
                  />
                  {isVideo && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* File Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.platform}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.targetFolderDisplay}/
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-200 truncate mt-0.5" title={item.fileName}>
                    {item.fileName}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{StorageService.formatBytes(item.sizeBytes)}</span>
                    <span>•</span>
                    <span>{new Date(item.savedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setPreviewItem(item)}
                    title="Preview file"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    title="Delete file"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-2xl w-full flex flex-col items-center bg-slate-900 rounded-3xl p-4 border border-slate-800">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-purple-400">
                {previewItem.targetFolderDisplay}/{previewItem.fileName}
              </span>
              <span className="text-xs text-slate-400">
                {StorageService.formatBytes(previewItem.sizeBytes)}
              </span>
            </div>

            <div className="w-full my-4 flex items-center justify-center bg-black rounded-2xl overflow-hidden max-h-[60vh]">
              {previewItem.fileType === 'video' ? (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="w-full max-h-[55vh] object-contain"
                />
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.fileName}
                  className="max-h-[55vh] w-auto object-contain"
                />
              )}
            </div>

            <button
              onClick={() => setPreviewItem(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
