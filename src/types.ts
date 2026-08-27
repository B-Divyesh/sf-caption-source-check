export type CaptionOrigin = 'machine' | 'human' | 'unknown';

export interface CaptionTrackInfo {
  id: string;
  label: string;
  language: string;
  kind: string;
  origin: CaptionOrigin;
  active: boolean;
}

export interface TranscriptLine {
  key: string;
  text: string;
  at: number;
}

export interface ScanState {
  available: boolean;
  videoCount: number;
  tracks: CaptionTrackInfo[];
  selectedTrackId: string | null;
  pageTitle: string;
  pageUrl: string;
  isLive: boolean;
  activeText: string;
  transcript: TranscriptLine[];
  scannedAt: number;
}

export type BridgeMessage =
  | { type: 'CSC_SCAN' }
  | { type: 'CSC_SELECT'; trackId: string }
  | { type: 'CSC_CLEAR' };
