import '../../src/extension-ui.css';
import './style.css';
import { languageName } from '../../src/caption-utils';
import { requestScan } from '../../src/scanner';
import type { ScanState } from '../../src/types';

const status = document.querySelector<HTMLElement>('#status')!;
const statusTitle = document.querySelector<HTMLElement>('#status-title')!;
const statusDetail = document.querySelector<HTMLElement>('#status-detail')!;
const trackPanel = document.querySelector<HTMLElement>('#track-panel')!;
const trackSelect = document.querySelector<HTMLSelectElement>('#track-select')!;
const language = document.querySelector<HTMLElement>('#language')!;
const trackKind = document.querySelector<HTMLElement>('#track-kind')!;
const origin = document.querySelector<HTMLElement>('#origin')!;
const liveStatus = document.querySelector<HTMLElement>('#live-status')!;
const preview = document.querySelector<HTMLElement>('#preview')!;
const captionText = document.querySelector<HTMLElement>('#caption-text')!;
const openReader = document.querySelector<HTMLButtonElement>('#open-reader')!;
const rescan = document.querySelector<HTMLButtonElement>('#rescan')!;

let sourceTabId: number | null = null;
let currentState: ScanState | null = null;
let pollTimer: number | undefined;

function setStatusClass(name: string) {
  status.className = `status state--${name}`;
  status.setAttribute('aria-busy', String(name === 'loading'));
}

function originLabel(value: string) {
  if (value === 'machine') return 'Machine-generated';
  if (value === 'human') return 'Human-created';
  return 'Type not stated';
}

function render(state: ScanState) {
  currentState = state;
  if (!state.available) {
    setStatusClass('empty');
    statusTitle.textContent = state.videoCount ? 'No exposed caption track' : 'No video found on this page';
    statusDetail.textContent = state.videoCount
      ? 'The player does not currently expose an official caption track. Try turning captions on in the player, then scan again.'
      : 'Open a page with a video or live stream, then scan again.';
    trackPanel.hidden = true;
    preview.hidden = true;
    openReader.disabled = true;
    return;
  }

  setStatusClass('found');
  statusTitle.textContent = `${state.tracks.length} exposed caption ${state.tracks.length === 1 ? 'track' : 'tracks'}`;
  statusDetail.textContent = 'This page provides a browser-readable track. Choose one below to follow it.';
  trackPanel.hidden = false;
  preview.hidden = false;
  openReader.disabled = false;

  const previous = trackSelect.value;
  trackSelect.replaceChildren(...state.tracks.map((track) => {
    const option = document.createElement('option');
    option.value = track.id;
    option.textContent = `${track.label} · ${track.language || 'language not stated'}`;
    return option;
  }));
  trackSelect.value = state.selectedTrackId || previous;
  const selected = state.tracks.find((track) => track.id === state.selectedTrackId) || state.tracks[0];
  language.textContent = languageName(selected.language);
  trackKind.textContent = selected.kind === 'subtitles' ? 'Subtitles' : selected.kind === 'captions' ? 'Captions' : selected.kind;
  origin.textContent = originLabel(selected.origin);
  liveStatus.textContent = state.isLive ? 'Live' : 'Recorded or unknown';
  captionText.textContent = state.activeText || state.transcript.at(-1)?.text || 'Waiting for the next caption…';
  captionText.classList.toggle('quiet', !state.activeText && !state.transcript.length);
}

function renderError(error: unknown) {
  setStatusClass('error');
  statusTitle.textContent = 'This page cannot be checked';
  statusDetail.textContent = error instanceof Error && /chrome|edge|extension|store/i.test(error.message)
    ? 'Browsers protect this internal page. Open the stream itself and try again.'
    : 'The page blocked access to its player. Reload the page, then scan again.';
  trackPanel.hidden = true;
  preview.hidden = true;
  openReader.disabled = true;
}

async function scan(showLoading = true) {
  if (showLoading) {
    setStatusClass('loading');
    statusTitle.textContent = 'Checking for captions…';
  }
  try {
    if (sourceTabId == null) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active browser tab is available.');
      sourceTabId = tab.id;
    }
    render(await requestScan(sourceTabId));
  } catch (error) {
    renderError(error);
  }
}

trackSelect.addEventListener('change', async () => {
  if (sourceTabId == null) return;
  try {
    render(await chrome.tabs.sendMessage(sourceTabId, { type: 'CSC_SELECT', trackId: trackSelect.value }));
  } catch (error) {
    renderError(error);
  }
});

rescan.addEventListener('click', () => scan());
openReader.addEventListener('click', async () => {
  if (sourceTabId == null || !currentState?.selectedTrackId) return;
  const params = new URLSearchParams({ tab: String(sourceTabId), track: currentState.selectedTrackId });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`/reader.html?${params}`) });
});

void scan();
pollTimer = window.setInterval(() => void scan(false), 1000);
window.addEventListener('unload', () => window.clearInterval(pollTimer));
