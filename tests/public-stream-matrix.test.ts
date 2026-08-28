import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installCaptionMonitor } from '../src/scanner';

type MatrixCase = {
  id: string;
  kind: 'captions' | 'subtitles' | 'chapters' | 'descriptions' | 'metadata' | 'none' | 'rendered';
  language: string;
  origin: 'machine' | 'human' | 'unknown';
  live: boolean;
  surface?: 'youtube' | 'timedtext' | 'testid' | 'toggle';
};

const matrix = JSON.parse(readFileSync('tests/fixtures/permitted-public-stream-matrix.json', 'utf8')) as {
  cases: MatrixCase[];
};

class MatrixTrack extends EventTarget {
  label = 'English';
  language = 'en';
  kind: TextTrackKind = 'captions';
  mode: TextTrackMode = 'disabled';
  activeCues: never[] = [];
}

function addRenderedSurface(surface: NonNullable<MatrixCase['surface']>) {
  if (surface === 'timedtext') {
    const container = document.createElement('div');
    container.className = 'player-timedtext-text-container';
    const node = document.createElement('span');
    node.textContent = 'Visible caption';
    node.getClientRects = () => ({ length: 1 } as DOMRectList);
    container.append(node);
    document.body.append(container);
    return;
  }
  const node = document.createElement(surface === 'toggle' ? 'button' : 'span');
  if (surface === 'youtube') node.className = 'ytp-caption-segment';
  if (surface === 'testid') node.dataset.testid = 'closed-caption-text';
  if (surface === 'toggle') node.className = 'ytp-subtitles-button';
  node.textContent = surface === 'toggle' ? '' : 'Visible caption';
  node.getClientRects = () => ({ length: 1 } as DOMRectList);
  document.body.append(node);
}

describe('permitted public-stream acceptance matrix', () => {
  beforeEach(() => {
    document.title = 'Public media fixture';
    document.body.innerHTML = '<video aria-label="Public media fixture"></video>';
    delete window.__captionSourceCheckInstalled;
    delete (window as Window & { __cscInternal?: unknown }).__cscInternal;
    Object.assign(globalThis, { chrome: { runtime: { onMessage: { addListener: vi.fn() } } } });
  });

  it('contains the required 50 versioned public-media cases', () => {
    expect(matrix.cases).toHaveLength(50);
    expect(new Set(matrix.cases.map((fixture) => fixture.id)).size).toBe(50);
  });

  it.each(matrix.cases)('$id reports the expected availability and language', (fixture) => {
    const video = document.querySelector('video')!;
    video.setAttribute('aria-label', fixture.live ? 'Live public media fixture' : 'Recorded public media fixture');
    Object.defineProperty(video, 'duration', { value: fixture.live ? Infinity : 120, configurable: true });
    Object.defineProperty(video, 'readyState', { value: 3, configurable: true });

    if (fixture.kind === 'rendered') {
      Object.defineProperty(video, 'textTracks', { value: [], configurable: true });
      addRenderedSurface(fixture.surface!);
    } else if (fixture.kind === 'none') {
      Object.defineProperty(video, 'textTracks', { value: [], configurable: true });
    } else {
      const track = new MatrixTrack();
      track.kind = fixture.kind;
      track.language = fixture.language;
      track.label = fixture.origin === 'machine'
        ? `${fixture.language} (auto-generated)`
        : fixture.origin === 'human' ? `${fixture.language} professional stenographer` : fixture.language;
      Object.defineProperty(video, 'textTracks', { value: [track], configurable: true });
    }

    const result = installCaptionMonitor();
    const isReadable = fixture.kind === 'captions' || fixture.kind === 'subtitles' || fixture.kind === 'rendered';
    expect(result.available).toBe(isReadable);
    expect(result.isLive).toBe(fixture.live);
    if (isReadable) {
      expect(result.tracks[0]?.language).toBe(fixture.language);
      expect(result.tracks[0]?.origin).toBe(fixture.origin);
    } else {
      expect(result.tracks).toEqual([]);
    }
  });
});
