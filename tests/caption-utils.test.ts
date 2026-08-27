import { describe, expect, it } from 'vitest';
import { classifyCaptionOrigin, cleanCueText, formatClock } from '../src/caption-utils';

describe('caption metadata helpers', () => {
  it('only claims a machine or human source when metadata states one', () => {
    expect(classifyCaptionOrigin('English (auto-generated)')).toBe('machine');
    expect(classifyCaptionOrigin('English', 'professional stenographer')).toBe('human');
    expect(classifyCaptionOrigin('English')).toBe('unknown');
  });

  it('turns cue markup into readable plain text', () => {
    expect(cleanCueText('<v Speaker>A &amp; B</v>\n next')).toBe('A & B next');
  });

  it('formats recorded and long-running stream timestamps', () => {
    expect(formatClock(67.8)).toBe('01:07');
    expect(formatClock(3723)).toBe('1:02:03');
  });
});
