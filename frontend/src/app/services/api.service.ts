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
  apiUrl = signal<string>(
    localStorage.getItem('socialsaver_backend_url') || 'http://localhost:8000'
  );

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
