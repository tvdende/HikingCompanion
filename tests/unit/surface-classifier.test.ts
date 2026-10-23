import { describe, expect, it } from 'vitest';
import { classifySurface } from '@hiking-companion/core';

describe('classifySurface', () => {
  it('prioritizes a known surface tag over highway defaults', () => {
    expect(classifySurface({ surface: 'gravel', highway: 'residential' })).toBe('gravel');
  });

  it('classifies track types and unknown tags', () => {
    expect(classifySurface({ tracktype: 'grade3' })).toBe('unpaved');
    expect(classifySurface({ highway: 'steps' })).toBe('unknown');
  });
});