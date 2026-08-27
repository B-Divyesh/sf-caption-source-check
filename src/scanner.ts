import type { ScanState } from './types';

declare global {
  interface Window {
    __captionSourceCheckInstalled?: boolean;
  }
}

// This entire function is serialized by chrome.scripting.executeScript.
// Keep all page-side helpers inside its body.
export function installCaptionMonitor(): ScanState {
  type StoredLine = { key: string; text: string; at: number };
  type Internal = {
    selected: string | null;
    transcript: StoredLine[];
    listening: WeakSet<TextTrack>;
    scan: () => ScanState;
  };

  const host = window as Window & { __cscInternal?: Internal };

  const clean = (value: string) => value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();

  const origin = (label: string, metadata: string): 'machine' | 'human' | 'unknown' => {
    const value = `${label} ${metadata}`.toLocaleLowerCase();
    if (/\b(auto(?:matically)?[- ]generated|machine[- ]generated|asr|speech recognition)\b/.test(value)) return 'machine';
    if (/\b(human|manual(?:ly)?|professional|stenographer)\b/.test(value)) return 'human';
    return 'unknown';
  };

  const readCues = (track: TextTrack, internal: Internal) => {
    const active = Array.from(track.activeCues || []) as VTTCue[];
    for (const cue of active) {
      const text = clean(cue.text || '');
      if (!text) continue;
      const key = `${cue.startTime}:${cue.endTime}:${text}`;
      if (internal.transcript.some((line) => line.key === key)) continue;
      internal.transcript.push({ key, text, at: cue.startTime });
    }
    internal.transcript = internal.transcript.slice(-150);
  };

  if (!host.__cscInternal) {
    const internal: Internal = {
      selected: null,
      transcript: [],
      listening: new WeakSet<TextTrack>(),
      scan: () => ({
        available: false,
        videoCount: 0,
        tracks: [],
        selectedTrackId: null,
        pageTitle: document.title,
        pageUrl: location.href,
        isLive: false,
        activeText: '',
        transcript: [],
        scannedAt: Date.now()
      })
    };

    internal.scan = () => {
      const videos = Array.from(document.querySelectorAll('video'));
      const trackRecords: Array<{ id: string; track: TextTrack; element?: HTMLTrackElement }> = [];

      videos.forEach((video, videoIndex) => {
        Array.from(video.textTracks || []).forEach((track, trackIndex) => {
          const element = Array.from(video.querySelectorAll('track'))[trackIndex];
          if (!element || element.readyState !== 3) {
            trackRecords.push({ id: `${videoIndex}:${trackIndex}`, track, element });
          }
        });
      });

      // Some players draw their official captions in the page rather than
      // exposing TextTrack cues. Recognize only explicit, visible player UI.
      const renderedNodes = Array.from(document.querySelectorAll<HTMLElement>(
        '.ytp-caption-segment, .player-timedtext-text-container span, [data-testid="closed-caption-text"]'
      )).filter((element) => element.getClientRects().length > 0);
      const renderedText = clean([...new Set(renderedNodes.map((element) => clean(element.textContent || '')).filter(Boolean))].join(' '));
      const captionToggle = document.querySelector<HTMLElement>(
        '.ytp-subtitles-button:not([aria-disabled="true"]), [data-testid="cc-button"]:not([aria-disabled="true"])'
      );
      const exposesRenderedTrack = Boolean(renderedText || (captionToggle && captionToggle.getClientRects().length > 0));

      if (!trackRecords.length && exposesRenderedTrack) {
        internal.selected = 'rendered:0';
        const video = videos[0];
        const at = video && Number.isFinite(video.currentTime) ? video.currentTime : 0;
        if (renderedText && internal.transcript.at(-1)?.text !== renderedText) {
          const key = `rendered:${Math.floor(at * 2)}:${renderedText}`;
          internal.transcript.push({ key, text: renderedText, at });
          internal.transcript = internal.transcript.slice(-150);
        }
        const liveLabel = `${video?.getAttribute('aria-label') || ''} ${document.title}`;
        const isLive = Boolean(video && (
          video.duration === Infinity
          || (!Number.isFinite(video.duration) && video.readyState > 0)
          || /\blive\b/i.test(liveLabel)
        ));
        return {
          available: true,
          videoCount: videos.length,
          tracks: [{
            id: 'rendered:0',
            label: 'Player-rendered captions',
            language: '',
            kind: 'captions',
            origin: origin(captionToggle?.getAttribute('aria-label') || '', ''),
            active: true
          }],
          selectedTrackId: 'rendered:0',
          pageTitle: document.title,
          pageUrl: location.href,
          isLive,
          activeText: renderedText,
          transcript: [...internal.transcript],
          scannedAt: Date.now()
        };
      }

      if (!internal.selected || !trackRecords.some(({ id }) => id === internal.selected)) {
        internal.selected = trackRecords.find(({ track }) => track.mode === 'showing')?.id
          || trackRecords[0]?.id
          || null;
      }

      for (const record of trackRecords) {
        if (record.id === internal.selected && record.track.mode === 'disabled') {
          record.track.mode = 'hidden';
        }
        if (!internal.listening.has(record.track)) {
          internal.listening.add(record.track);
          record.track.addEventListener('cuechange', () => {
            if (record.id === internal.selected) readCues(record.track, internal);
          });
        }
        if (record.id === internal.selected) readCues(record.track, internal);
      }

      const selected = trackRecords.find(({ id }) => id === internal.selected);
      const selectedCues = selected
        ? (Array.from(selected.track.activeCues || []) as VTTCue[]).map((cue) => clean(cue.text || '')).filter(Boolean)
        : [];
      const selectedVideoIndex = selected ? Number(selected.id.split(':')[0]) : 0;
      const selectedVideo = videos[selectedVideoIndex];
      const liveLabel = `${selectedVideo?.getAttribute('aria-label') || ''} ${document.title}`;
      const isLive = Boolean(selectedVideo && (
        selectedVideo.duration === Infinity
        || (!Number.isFinite(selectedVideo.duration) && selectedVideo.readyState > 0)
        || /\blive\b/i.test(liveLabel)
      ));

      return {
        available: trackRecords.length > 0,
        videoCount: videos.length,
        tracks: trackRecords.map(({ id, track, element }, index) => ({
          id,
          label: track.label || element?.label || `Caption track ${index + 1}`,
          language: track.language || element?.srclang || '',
          kind: track.kind || element?.kind || 'captions',
          origin: origin(track.label || element?.label || '', `${element?.dataset.kind || ''} ${element?.dataset.origin || ''}`),
          active: id === internal.selected
        })),
        selectedTrackId: internal.selected,
        pageTitle: document.title,
        pageUrl: location.href,
        isLive,
        activeText: selectedCues.join(' '),
        transcript: [...internal.transcript],
        scannedAt: Date.now()
      };
    };

    chrome.runtime.onMessage.addListener((message: { type?: string; trackId?: string }, _sender, sendResponse) => {
      if (message.type === 'CSC_SCAN') sendResponse(internal.scan());
      if (message.type === 'CSC_SELECT' && message.trackId) {
        internal.selected = message.trackId;
        internal.transcript = [];
        sendResponse(internal.scan());
      }
      if (message.type === 'CSC_CLEAR') {
        internal.transcript = [];
        sendResponse(internal.scan());
      }
    });

    host.__cscInternal = internal;
    host.__captionSourceCheckInstalled = true;
  }

  return host.__cscInternal.scan();
}

export async function installOnTab(tabId: number): Promise<ScanState> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: installCaptionMonitor
  });
  if (!result?.result) throw new Error('The page did not return a caption status.');
  return result.result as ScanState;
}

export async function requestScan(tabId: number): Promise<ScanState> {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'CSC_SCAN' });
  } catch {
    return installOnTab(tabId);
  }
}
