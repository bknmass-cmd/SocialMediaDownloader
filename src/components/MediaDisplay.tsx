import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FolderDown,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Check,
  CheckSquare,
  Square,
  ZoomIn,
  X,
  ExternalLink,
  Music
} from 'lucide-react';
import { ExtractedMedia, MediaItem } from '../types';

interface MediaDisplayProps {
  media: ExtractedMedia;
  onSaveItems: (items: MediaItem[], indices?: number[]) => void;
  isSaving: boolean;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  onSaveItems,
  isSaving,
}) => {
  const images = media.items.filter(m => m.type === 'image');
  const videos = media.items.filter(m => m.type === 'video');

  // Multi-image selection state
  const [selectedIds, setSelectedIds] = useState<string[]>(images.map(img => img.id));
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  // Video player audio & playback state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default to unmute/with music as requested
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setSelectedIds(images.map(img => img.id));
  }, [media]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleSelectImage = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllImages = () => setSelectedIds(images.map(i => i.id));
  const deselectAllImages = () => setSelectedIds([]);

  const handleDownloadSelected = () => {
    const selectedMedia: MediaItem[] = [];
    const indices: number[] = [];
    images.forEach((img, idx) => {
      if (selectedIds.includes(img.id)) {
        selectedMedia.push(img);
        indices.push(idx);
      }
    });
    if (selectedMedia.length > 0) {
      onSaveItems(selectedMedia, indices);
    }
  };

  const handleDownloadAllImages = () => {
    onSaveItems(images, images.map((_, i) => i));
  };

  const togglePlayVideo = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
      {/* Header Info */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={media.author.avatar}
            alt={media.author.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">
              {media.author.name}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              @{media.author.handle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {media.platform}
          </span>
          <a
            href={media.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Caption snippet */}
      {media.caption && (
        <div className="px-4 sm:px-5 text-xs text-slate-300 leading-relaxed">
          {media.caption}
        </div>
      )}

      {/* Media Content */}
      <div className="p-4 sm:p-5 pt-0 space-y-4">
        {/* ================= CASE 1: VIDEO ================= */}
        {videos.length > 0 && (
          <div className="space-y-3">
            {/* Audio Mode Selector Buttons (Mute / With Music) */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  Audio Mode:
                </span>
                <span className="text-[10px] text-slate-400">
                  {isMuted ? 'Muted' : 'Playing with full background music'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* With Music */}
                <button
                  onClick={() => setIsMuted(false)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    !isMuted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>With Music / Sound</span>
                  {!isMuted && (
                    <span className="flex gap-0.5 items-end h-3">
                      <span className="w-1 bg-emerald-400 h-2 animate-bounce"></span>
                      <span className="w-1 bg-emerald-400 h-3 animate-bounce [animation-delay:0.1s]"></span>
                    </span>
                  )}
                </button>

                {/* Mute */}
                <button
                  onClick={() => setIsMuted(true)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span>Mute Video</span>
                </button>
              </div>
            </div>

            {/* Target Folder Hint */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200">
              <FolderDown className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Target phone folder: <strong className="text-white font-mono">SnapVault/videos/</strong></span>
            </div>

            {/* Video Player */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 group shadow-xl">
              <video
                ref={videoRef}
                src={videos[0].url}
                poster={videos[0].previewUrl}
                playsInline
                loop
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                    if (!duration && videoRef.current.duration) setDuration(videoRef.current.duration);
                  }
                }}
                onClick={togglePlayVideo}
                className="w-full max-h-[420px] object-contain mx-auto cursor-pointer"
              />

              {!isPlaying && (
                <div
                  onClick={togglePlayVideo}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5 shadow-2xl flex items-center justify-center">
                    <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center pl-1">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Progress & Controls */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-2">
                  <button onClick={togglePlayVideo} className="p-1 hover:text-purple-400">
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                  <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:text-purple-400">
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/30 text-purple-200">
                  HD Video
                </span>
              </div>
            </div>

            {/* Download Video Button */}
            <button
              onClick={() => onSaveItems([videos[0]])}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>{isSaving ? 'Saving to SnapVault/videos...' : 'Download Video to SnapVault/videos'}</span>
            </button>
          </div>
        )}

        {/* ================= CASE 2: IMAGES / MULTI-IMAGE ================= */}
        {images.length > 0 && (
          <div className="space-y-3">
            {/* Multi-image Selection Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {images.length > 1 ? `Multi-Image (${images.length} Photos)` : 'Single Photo'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  {selectedIds.length} of {images.length} selected
                </span>
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={selectAllImages}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                  >
                    <CheckSquare className="w-3 h-3 text-purple-400" />
                    <span>Select All</span>
                  </button>
                  <button
                    onClick={deselectAllImages}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                  >
                    <Square className="w-3 h-3 text-slate-400" />
                    <span>Deselect</span>
                  </button>
                </div>
              )}
            </div>

            {/* Target Folder Hint */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200">
              <FolderDown className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Target phone folder: <strong className="text-white font-mono">SnapVault/images/</strong></span>
            </div>

            {/* Photos Grid */}
            <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {images.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectImage(item.id)}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all aspect-[4/5] bg-slate-950 ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                        : 'border-slate-800 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={item.previewUrl || item.url}
                      alt={`Photo ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 text-[10px] font-bold text-white">
                      #{index + 1}
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`absolute top-2 right-2 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white ring-2 ring-white/50'
                          : 'bg-black/60 border border-white/40 text-transparent'
                      }`}
                    >
                      <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>

                    {/* Zoom / Single download overlay */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomIndex(index);
                        }}
                        className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaveItems([item], [index]);
                        }}
                        className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Download Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={handleDownloadSelected}
                disabled={selectedIds.length === 0 || isSaving}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isSaving ? 'Saving to SnapVault/images...' : `Download Selected (${selectedIds.length})`}
                </span>
              </button>

              {images.length > 1 && (
                <button
                  onClick={handleDownloadAllImages}
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                >
                  <FolderDown className="w-4 h-4 text-purple-400" />
                  <span>Download All ({images.length})</span>
                </button>
              )}
            </div>

            {/* Fullscreen Lightbox Zoom Modal */}
            {zoomIndex !== null && (
              <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <button
                  onClick={() => setZoomIndex(null)}
                  className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="max-w-3xl max-h-[85vh] flex flex-col items-center">
                  <img
                    src={images[zoomIndex].url}
                    alt="Zoom"
                    referrerPolicy="no-referrer"
                    className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl"
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-slate-400">Photo {zoomIndex + 1} of {images.length}</span>
                    <button
                      onClick={() => {
                        onSaveItems([images[zoomIndex]], [zoomIndex]);
                        setZoomIndex(null);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download to SnapVault/images</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
