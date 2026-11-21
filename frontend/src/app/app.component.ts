import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import confetti from 'canvas-confetti';
import { ApiService } from './services/api.service';
import { StorageService } from './services/storage.service';
import { ExtractResponse, MediaItem, Platform, SavedMedia } from './models/media.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  apiService = inject(ApiService);
  storageService = inject(StorageService);

  // Active Tab: 'home' | 'gallery' | 'settings'
  activeTab = signal<'home' | 'gallery' | 'settings'>('home');

  // URL & Extraction state
  urlInput = signal<string>('');
  isExtracting = signal<boolean>(false);
  extractedData = signal<ExtractResponse | null>(null);
  errorMessage = signal<string | null>(null);

  // Multi-image selection state
  selectedIds = signal<string[]>([]);

  // Downloading progress
  isDownloading = signal<boolean>(false);
  downloadProgressText = signal<string>('');
  activeZoomImage = signal<string | null>(null);
  activePreviewVideo = signal<string | null>(null);

  // Settings
  backendUrlInput = signal<string>(this.apiService.apiUrl());
  showSettingsModal = signal<boolean>(false);

  // Detected Platform computed
  detectedPlatform = computed<Platform>(() => {
    const val = this.urlInput().trim().toLowerCase();
    if (val.includes('instagram.com') || val.includes('instagr.am')) return 'instagram';
    if (val.includes('youtube.com') || val.includes('youtu.be')) return 'youtube';
    if (val.includes('threads.net')) return 'threads';
    if (val.includes('twitter.com') || val.includes('x.com') || val.includes('t.co')) return 'twitter';
    return 'generic';
  });

  // Selected count computed
  selectedCount = computed<number>(() => this.selectedIds().length);

  // Paste from clipboard using Capacitor Clipboard plugin
  async pasteFromClipboard(): Promise<void> {
    try {
      const result = await Clipboard.read();
      if (result && result.value) {
        const val = result.value.trim();
        this.urlInput.set(val);
        if (val.startsWith('http://') || val.startsWith('https://')) {
          this.fetchPreview(val);
        } else {
          this.errorMessage.set('Clipboard does not contain a valid URL. Please copy a post link from Instagram, YouTube, Threads, or X.');
        }
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  }

  // Load a verified sample carousel URL
  loadSampleUrl(): void {
    const sample = 'https://www.instagram.com/p/De8wwdvk-iW/';
    this.urlInput.set(sample);
    this.fetchPreview(sample);
  }

  // Fetch Preview from Backend API
  fetchPreview(overrideUrl?: string): void {
    const target = (overrideUrl || this.urlInput()).trim();
    if (!target) {
      this.errorMessage.set('Please enter or paste a valid link.');
      return;
    }

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      this.errorMessage.set('Please enter a valid link starting with https:// (from Instagram, YouTube, Threads, or X).');
      return;
    }

    if (target.includes(' ') || target.length < 12) {
      this.errorMessage.set('Invalid link format. Please paste a clean post or video URL.');
      return;
    }

    this.isExtracting.set(true);
    this.errorMessage.set(null);
    this.extractedData.set(null);

    this.apiService.extractMedia(target).subscribe({
      next: (data) => {
        this.isExtracting.set(false);
        data.originalUrl = target;
        this.extractedData.set(data);

        // By default select all items if carousel
        if (data.items) {
          this.selectedIds.set(data.items.map(i => i.id));
        }
      },
      error: (err) => {
        this.isExtracting.set(false);
        const detail = err.error?.detail || err.message || 'Could not connect to SocialSaver backend.';
        this.errorMessage.set(detail);
      }
    });
  }

  // Multi-image selection helpers
  toggleSelect(id: string): void {
    const current = this.selectedIds();
    if (current.includes(id)) {
      this.selectedIds.set(current.filter(x => x !== id));
    } else {
      this.selectedIds.set([...current, id]);
    }
  }

  selectAll(): void {
    const data = this.extractedData();
    if (data && data.items) {
      this.selectedIds.set(data.items.map(i => i.id));
    }
  }

  deselectAll(): void {
    this.selectedIds.set([]);
  }

  // Get reliable preview URL through backend proxy to avoid CORS/Referer issues
  getPreviewUrl(target: MediaItem | string | undefined): string {
    if (!target) return '';
    const raw = typeof target === 'string' ? target : (target.thumbnail_url || target.media_url);
    if (!raw) return '';
    if (raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('file:')) {
      return raw;
    }
    return this.apiService.getDownloadUrl(raw, 'image');
  }

  // Download Single Image
  async downloadImage(item: MediaItem, customFilename?: string): Promise<void> {
    this.isDownloading.set(true);
    this.downloadProgressText.set('Downloading image...');

    try {
      const downloadUrl = this.apiService.getDownloadUrl(item.media_url, 'image');
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Image download failed');
      const blob = await res.blob();

      const filename = customFilename || `socialsaver_${Date.now()}.jpg`;
      await this.storageService.saveMedia(
        blob,
        filename,
        'image',
        this.extractedData()?.platform || 'generic',
        item.thumbnail_url || item.media_url
      );

      this.triggerConfetti();
    } catch (e: any) {
      alert('Error downloading image: ' + (e.message || e));
    } finally {
      this.isDownloading.set(false);
      this.downloadProgressText.set('');
    }
  }

  // Download Selected Images from Carousel
  async downloadSelectedImages(): Promise<void> {
    const data = this.extractedData();
    if (!data || !data.items) return;

    const toDownload = data.items.filter(i => this.selectedIds().includes(i.id));
    if (toDownload.length === 0) {
      alert('Please select at least one image to download.');
      return;
    }

    this.isDownloading.set(true);

    try {
      for (let i = 0; i < toDownload.length; i++) {
        this.downloadProgressText.set(`Downloading image ${i + 1} of ${toDownload.length}...`);
        const item = toDownload[i];
        const downloadUrl = this.apiService.getDownloadUrl(item.media_url, 'image');
        const res = await fetch(downloadUrl);
        if (res.ok) {
          const blob = await res.blob();
          const filename = `socialsaver_${Date.now()}_${i + 1}.jpg`;
          await this.storageService.saveMedia(
            blob,
            filename,
            'image',
            data.platform,
            item.thumbnail_url || item.media_url
          );
        }
      }
      this.triggerConfetti();
    } catch (e: any) {
      alert('Batch download error: ' + (e.message || e));
    } finally {
      this.isDownloading.set(false);
      this.downloadProgressText.set('');
    }
  }

  // Download All Images
  downloadAllImages(): void {
    this.selectAll();
    this.downloadSelectedImages();
  }

  // Download Video with Audio or Muted
  async downloadVideo(mode: 'video_with_audio' | 'video_mute'): Promise<void> {
    const data = this.extractedData();
    if (!data) return;

    this.isDownloading.set(true);
    const label = mode === 'video_mute' ? 'Generating mute video...' : 'Downloading merged video + audio...';
    this.downloadProgressText.set(label);

    try {
      const downloadUrl = this.apiService.getDownloadUrl(data.originalUrl || this.urlInput(), mode);
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Video generation failed from backend.');
      const blob = await res.blob();

      const suffix = mode === 'video_mute' ? 'muted' : 'video';
      const filename = `socialsaver_${suffix}_${Date.now()}.mp4`;
      const preview = data.items && data.items[0] ? data.items[0].thumbnail_url : '';

      await this.storageService.saveMedia(
        blob,
        filename,
        'video',
        data.platform,
        preview,
        mode === 'video_mute'
      );

      this.triggerConfetti();
    } catch (e: any) {
      alert('Error downloading video: ' + (e.message || e));
    } finally {
      this.isDownloading.set(false);
      this.downloadProgressText.set('');
    }
  }

  // Native Share file using @capacitor/share
  async shareSavedFile(item: SavedMedia): Promise<void> {
    try {
      if (item.fileUri) {
        await Share.share({
          title: item.fileName,
          text: `Saved via SocialSaver: ${item.fileName}`,
          url: item.fileUri,
          dialogTitle: 'Share with Friends'
        });
      } else {
        await Share.share({
          title: item.fileName,
          text: `Saved via SocialSaver (${item.folder}/${item.fileName})`,
          dialogTitle: 'Share'
        });
      }
    } catch (e) {
      console.warn('Share canceled or error:', e);
    }
  }

  // Save Backend URL in Settings
  saveBackendUrl(): void {
    this.apiService.setApiUrl(this.backendUrlInput());
    this.showSettingsModal.set(false);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  triggerConfetti(): void {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981']
      });
    } catch {}
  }
}
