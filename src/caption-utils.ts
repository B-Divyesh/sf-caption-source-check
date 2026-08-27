import type { CaptionOrigin } from './types';

export function classifyCaptionOrigin(label = '', metadata = ''): CaptionOrigin {
  const description = `${label} ${metadata}`.toLocaleLowerCase();
  if (/\b(auto(?:matically)?[- ]generated|machine[- ]generated|asr|speech recognition)\b/.test(description)) {
    return 'machine';
  }
  if (/\b(human|manual(?:ly)?|professional|stenographer)\b/.test(description)) {
    return 'human';
  }
  return 'unknown';
}

export function cleanCueText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function languageName(code: string): string {
  if (!code) return 'Language not stated';
  try {
    return new Intl.DisplayNames([navigator.language || 'en'], { type: 'language' }).of(code) || code;
  } catch {
    return code;
  }
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60);
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
