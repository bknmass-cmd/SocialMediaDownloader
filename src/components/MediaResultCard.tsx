import React, { useState } from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { ExtractedPost } from '../types';

interface MediaResultCardProps {
  post: ExtractedPost;
  children: React.ReactNode;
}

export const MediaResultCard: React.FC<MediaResultCardProps> = ({ post, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPlatformBadge = () => {
    switch (post.platform) {
      case 'instagram':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 text-white shadow-sm shadow-pink-500/20">
            Instagram
          </span>
        );
      case 'twitter':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500 text-white shadow-sm shadow-sky-500/20">
            Twitter / X
          </span>
        );
      case 'threads':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-950 shadow-sm shadow-white/10">
            Threads
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm transition-all">
      {/* Author & Header Info */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/30 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-100 truncate">
                {post.author.name}
              </h3>
              {post.author.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">
              @{post.author.handle} • <span className="text-slate-500">{post.timestamp}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getPlatformBadge()}
          <a
            href={post.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original post"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Caption snippet */}
      {post.caption && (
        <div className="px-4 sm:px-5 py-3 bg-slate-950/40 border-b border-slate-800/50">
          <p className={`text-xs text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
            {post.caption}
          </p>
          {post.caption.length > 120 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Main Media Content (Multi-Image selector or Video Player) */}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
};
