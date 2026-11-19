import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, FolderDown, Maximize2, Music, Sparkles } from 'lucide-react';
import { MediaItem, ExtractedPost } from '../types';

interface VideoPlayerProps {
  mediaItem: MediaItem;
  post: ExtractedPost;
  onSaveVideo: (item: MediaItem) => void;
  isSaving: boolean;
}

export const VideoPlayerWithAudioControl: React.FC<VideoPlayerProps> = ({
  mediaItem,
  post,
  onSaveVideo,
  isSaving,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default to unmute/with music as requested
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(mediaItem.duration || 0);
  const [volume, setVolume] = useState(0.85);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(e => {
        console.warn('Autoplay prevented:', e);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!duration && videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setAudioMode = (muted: boolean) => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
      if (!muted && videoRef.current.volume === 0) {
        setVolume(0.85);
        videoRef.current.volume = 0.85;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4">
      {/* Audio Mode Quick-Switcher (Directly answering user's request: "mute or with music video") */}
      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-200">Audio Mode Selector:</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {isMuted ? 'Audio currently muted' : 'Playing with full background music'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* With Music Button */}
          <button
            onClick={() => setAudioMode(false)}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
              !isMuted
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>With Music / Sound</span>
            {!isMuted && (
              <span className="flex gap-0.5 items-end h-3">
                <span className="w-1 bg-emerald-400 h-2 animate-bounce"></span>
                <span className="w-1 bg-emerald-400 h-3 animate-bounce [animation-delay:0.1s]"></span>
                <span className="w-1 bg-emerald-400 h-1.5 animate-bounce [animation-delay:0.2s]"></span>
              </span>
            )}
          </button>

          {/* Mute Button */}
          <button
            onClick={() => setAudioMode(true)}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
              isMuted
                ? 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <VolumeX className="w-4 h-4 text-rose-400" />
            <span>Mute Video</span>
          </button>
        </div>
      </div>

      {/* Target Phone Storage Location Hint */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200">
        <FolderDown className="w-4 h-4 text-purple-400 shrink-0" />
        <span>Target phone storage folder: <strong className="text-white font-mono">SnapVault/videos/</strong></span>
      </div>

      {/* Video Player Container */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 group shadow-2xl">
        <video
          ref={videoRef}
          src={mediaItem.url}
          poster={mediaItem.previewUrl}
          playsInline
          loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onClick={togglePlay}
          className="w-full max-h-[440px] object-contain mx-auto cursor-pointer"
        />

        {/* Center Big Play Button (when paused) */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5 shadow-2xl shadow-purple-500/50 hover:scale-110 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center pl-1">
                <Play className="w-7 h-7 text-white fill-white" />
              </div>
            </div>
          </div>
        )}

        {/* Floating audio badge on top left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
          {!isMuted ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              <span>Muted</span>
            </>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2">
          {/* Progress Seek Bar */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />

          <div className="flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button onClick={togglePlay} className="p-1 hover:text-purple-400 transition-colors">
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              {/* Volume / Mute toggle */}
              <button onClick={() => setAudioMode(!isMuted)} className="p-1 hover:text-purple-400 transition-colors">
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Time display */}
              <span className="text-[11px] font-medium text-slate-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40">
                1080p MP4
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Download Video Button */}
      <button
        onClick={() => onSaveVideo(mediaItem)}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40"
      >
        <Download className="w-4 h-4" />
        <span>
          {isSaving ? 'Saving to SnapVault/videos/...' : 'Download Video to SnapVault/videos'}
        </span>
      </button>
    </div>
  );
};
