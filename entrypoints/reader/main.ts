import '../../src/extension-ui.css';
import './style.css';
import { formatClock } from '../../src/caption-utils';
import type { ScanState } from '../../src/types';

const params = new URLSearchParams(location.search);
const tabId = Number(params.get('tab'));
const requestedTrack = params.get('track');
const root = document.documentElement;
const sourceTitle = document.querySelector<HTMLElement>('#source-title')!;
const status = document.querySelector<HTMLElement>('#reader-status')!;
const statusText = document.querySelector<HTMLElement>('#reader-status-text')!;
const transcript = document.querySelector<HTMLElement>('#transcript')!;
const livePill = document.querySelector<HTMLElement>('#live-pill')!;
const latest = document.querySelector<HTMLButtonElement>('#latest')!;
const contrast = document.querySelector<HTMLButtonElement>('#contrast')!;
let selected = requestedTrack;
let renderedKeys = new Set<string>();
let fontSize = 34;
let followingLatest = true;
let timer: number | undefined;

function setStatus(kind: 'loading' | 'found' | 'empty' | 'error', text: string) {
  status.className = `reader-status state--${kind}`;
  status.setAttribute('aria-busy', String(kind === 'loading'));
  statusText.textContent = text;
}

function render(state: ScanState) {
  sourceTitle.textContent = state.pageTitle || 'Untitled video page';
  livePill.hidden = !state.isLive;
  if (!state.available) {
    setStatus('empty', 'The track is no longer exposed. Turn captions on in the player or return to the extension and scan again.');
    return;
  }
  setStatus('found', state.activeText ? 'Receiving captions' : 'Connected — waiting for the next caption');
  status.hidden = Boolean(state.transcript.length);

  for (const line of state.transcript) {
    if (renderedKeys.has(line.key)) continue;
    renderedKeys.add(line.key);
    const row = document.createElement('div');
    row.className = 'caption-row';
    const time = document.createElement('time');
    time.textContent = formatClock(line.at);
    const text = document.createElement('p');
    text.textContent = line.text;
    row.append(time, text);
    transcript.append(row);
  }

  if (followingLatest && transcript.lastElementChild) transcript.lastElementChild.scrollIntoView({ block: 'end' });
}

async function poll() {
  if (!Number.isInteger(tabId)) {
    setStatus('error', 'The source tab is missing. Reopen the reader from the extension.');
    return;
  }
  try {
    let state: ScanState = await chrome.tabs.sendMessage(tabId, { type: 'CSC_SCAN' });
    if (selected && state.selectedTrackId !== selected && state.tracks.some((track) => track.id === selected)) {
      state = await chrome.tabs.sendMessage(tabId, { type: 'CSC_SELECT', trackId: selected });
    }
    selected = state.selectedTrackId;
    render(state);
  } catch {
    setStatus('error', 'The source page disconnected. Keep it open, then reopen this reader from the extension.');
    window.clearInterval(timer);
  }
}

document.querySelector('#larger')!.addEventListener('click', () => {
  fontSize = Math.min(56, fontSize + 4);
  root.style.setProperty('--caption-size', `${fontSize}px`);
});
document.querySelector('#smaller')!.addEventListener('click', () => {
  fontSize = Math.max(22, fontSize - 4);
  root.style.setProperty('--caption-size', `${fontSize}px`);
});
contrast.addEventListener('click', () => {
  const enabled = root.classList.toggle('high-contrast');
  contrast.setAttribute('aria-pressed', String(enabled));
});
document.querySelector('#clear')!.addEventListener('click', () => {
  transcript.replaceChildren();
});
latest.addEventListener('click', () => {
  followingLatest = true;
  latest.hidden = true;
  transcript.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' });
});
window.addEventListener('scroll', () => {
  followingLatest = innerHeight + scrollY >= document.documentElement.scrollHeight - 100;
  latest.hidden = followingLatest || !transcript.children.length;
}, { passive: true });

void poll();
timer = window.setInterval(() => void poll(), 700);
window.addEventListener('beforeunload', () => window.clearInterval(timer));
