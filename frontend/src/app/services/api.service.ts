import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExtractResponse } from '../models/media.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  // Signal storing current Backend API base URL
  apiUrl = signal<string>(this.resolveInitialApiUrl());

  private resolveInitialApiUrl(): string {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('socialsaver_backend_url') : null;
    if (saved) {
      return saved;
    }

    // Check runtime env if available (e.g. injected in SSR/functions via Vercel service binding)
    const proc = (globalThis as any).process;
    if (proc && proc.env && proc.env['BACKEND_URL']) {
      return proc.env['BACKEND_URL'];
    }

    // In web browser (e.g. deployed on Vercel under unified domain):
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      // If developing locally on standalone Angular port 4200 without reverse proxy:
      if (window.location.port === '4200') {
        return 'http://localhost:8000';
      }
      // On Vercel deployment or reverse-proxy, use same-origin relative path
      return '';
    }

    // Default fallback (e.g. Capacitor native app before user configures backend IP)
    return 'http://localhost:8000';
  }

  setApiUrl(url: string): void {
    const clean = url.trim().replace(/\/+$/, '');
    this.apiUrl.set(clean);
    localStorage.setItem('socialsaver_backend_url', clean);
  }

  extractMedia(targetUrl: string): Observable<ExtractResponse> {
    const endpoint = `${this.apiUrl()}/api/extract`;
    return this.http.post<ExtractResponse>(endpoint, { url: targetUrl.trim() });
  }

  getDownloadUrl(url: string, mode: 'image' | 'video_with_audio' | 'video_mute', itemIndex?: number): string {
    const base = `${this.apiUrl()}/api/download?url=${encodeURIComponent(url)}&mode=${mode}`;
    return itemIndex !== undefined ? `${base}&item_index=${itemIndex}` : base;
  }
}
