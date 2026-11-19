import React, { useState } from 'react';
import { Check, Download, ZoomIn, CheckSquare, Square, FolderDown, Maximize2, X } from 'lucide-react';
import { MediaItem, ExtractedPost } from '../types';

interface MultiImageSelectorProps {
  post: ExtractedPost;
  onSaveItems: (items: MediaItem[], indices: number[]) => void;
  isSaving: boolean;
}

export const MultiImageSelector: React.FC<MultiImageSelectorProps> = ({
  post,
  onSaveItems,
  isSaving,
}) => {
  const images = post.media.filter(m => m.type === 'image');

  // Selected image IDs
  const [selectedIds, setSelectedIds] = useState<string[]>(
    images.map(img => img.id) // By default, all selected
  );

  // Lightbox preview modal state
  const [activeZoomIndex, setActiveZoomIndex] = useState<number | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(images.map(img => img.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleDownloadSelected = () => {
    const selectedMedia: MediaItem[] = [];
    const selectedIndices: number[] = [];

    images.forEach((img, idx) => {
      if (selectedIds.includes(img.id)) {
        selectedMedia.push(img);
        selectedIndices.push(idx);
      }
    });

    if (selectedMedia.length > 0) {
      onSaveItems(selectedMedia, selectedIndices);
    }
  };

  const handleDownloadAll = () => {
    onSaveItems(images, images.map((_, i) => i));
  };

  const handleDownloadSingle = (img: MediaItem, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveItems([img], [idx]);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-200">
            {images.length > 1 ? `Multi-Image Carousel (${images.length})` : 'Single Image'}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {selectedIds.length} of {images.length} selected
          </span>
        </div>

        {/* Select All / Deselect All */}
        {images.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={selectAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
            >
              <CheckSquare className="w-3 h-3 text-purple-400" />
              <span>Select All</span>
            </button>
            <button
              onClick={deselectAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
            >
              <Square className="w-3 h-3 text-slate-400" />
              <span>Deselect</span>
            </button>
          </div>
        )}
      </div>

      {/* Target Folder Hint */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200">
        <FolderDown className="w-4 h-4 text-purple-400 shrink-0" />
        <span>Target phone storage folder: <strong className="text-white font-mono">SnapVault/images/</strong></span>
      </div>

      {/* Grid of Images */}
      <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {images.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-200 aspect-[4/5] bg-slate-950 ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20'
                  : 'border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-90'
              }`}
            >
              {/* Image */}
              <img
                src={item.previewUrl || item.url}
                alt={`Slide ${index + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Slide number pill */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-white">
                #{index + 1}
              </div>

              {/* Selection Checkbox */}
              <div
                className={`absolute top-2 right-2 w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-md ${
                  isSelected
                    ? 'bg-purple-600 text-white ring-2 ring-white/50 scale-105'
                    : 'bg-black/60 backdrop-blur-md text-transparent border border-white/40'
                }`}
              >
                <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
              </div>

              {/* Overlay hover actions */}
              <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveZoomIndex(index);
                  }}
                  title="Zoom Image"
                  className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white hover:bg-black/90 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDownloadSingle(item, index, e)}
                  title="Download this image only"
                  className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
        {/* Download Selected */}
        <button
          onClick={handleDownloadSelected}
          disabled={selectedIds.length === 0 || isSaving}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>
            {isSaving
              ? 'Saving to SnapVault/images...'
              : `Download Selected (${selectedIds.length})`}
          </span>
        </button>

        {/* Download All (if more than 1 image) */}
        {images.length > 1 && (
          <button
            onClick={handleDownloadAll}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-40"
          >
            <FolderDown className="w-4 h-4 text-purple-400" />
            <span>Download All ({images.length})</span>
          </button>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {activeZoomIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setActiveZoomIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-3xl max-h-[85vh] flex flex-col items-center">
            <img
              src={images[activeZoomIndex].url}
              alt="Zoomed preview"
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Photo {activeZoomIndex + 1} of {images.length}
              </span>
              <button
                onClick={(e) => {
                  handleDownloadSingle(images[activeZoomIndex], activeZoomIndex, e);
                  setActiveZoomIndex(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to SnapVault/images</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
