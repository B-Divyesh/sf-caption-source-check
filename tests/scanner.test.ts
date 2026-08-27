import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installCaptionMonitor } from '../src/scanner';

class FakeTrack extends EventTarget {
  label = 'English (auto-generated)';
  language = 'en';
  kind = 'captions';
  mode: TextTrackMode = 'disabled';
  activeCues: Array<{ text: string; startTime: number; endTime: number }> = [];
}

describe('page caption monitor', () => {
  beforeEach(() => {
    document.title = 'Public live briefing';
    document.body.innerHTML = '<video aria-label="Live briefing"></video>';
    delete window.__captionSourceCheckInstalled;
    delete (window as Window & { __cscInternal?: unknown }).__cscInternal;
    Object.assign(globalThis, {
      chrome: {
        runtime: {
          onMessage: { addListener: vi.fn() }
        }
      }
    });
  });

  it('finds exposed tracks, marks live streams, and collects active cues', () => {
    const video = document.querySelector('video')!;
    const track = new FakeTrack();
    Object.defineProperty(video, 'textTracks', { value: [track], configurable: true });
    Object.defineProperty(video, 'duration', { value: Infinity, configurable: true });
    Object.defineProperty(video, 'readyState', { value: 3, configurable: true });

    const initial = installCaptionMonitor();
    expect(initial.available).toBe(true);
    expect(initial.tracks[0]).toMatchObject({ language: 'en', origin: 'machine' });
    expect(initial.isLive).toBe(true);
    expect(track.mode).toBe('hidden');

    track.activeCues = [{ text: '<b>Signal</b> is clear', startTime: 12, endTime: 14 }];
    track.dispatchEvent(new Event('cuechange'));
    const updated = installCaptionMonitor();
    expect(updated.activeText).toBe('Signal is clear');
    expect(updated.transcript).toHaveLength(1);
  });

  it('reports video-without-captions as unavailable', () => {
    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'textTracks', { value: [], configurable: true });
    const result = installCaptionMonitor();
    expect(result).toMatchObject({ available: false, videoCount: 1, tracks: [] });
  });
});
