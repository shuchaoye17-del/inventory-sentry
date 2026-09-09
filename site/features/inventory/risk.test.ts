import { describe, expect, it } from 'vitest';

import { highestRisk } from './risk';

describe('highestRisk', () => {
  it('returns green when analysis finds no issues', () => {
    expect(highestRisk([])).toBe('green');
  });

  it('returns yellow when every issue requires review only', () => {
    expect(
      highestRisk([
        { code: 'NEW_SKU', level: 'yellow', message: 'New SKU detected.' },
      ]),
    ).toBe('yellow');
  });

  it('returns red when any issue blocks the update', () => {
    expect(
      highestRisk([
        { code: 'NEW_SKU', level: 'yellow', message: 'New SKU detected.' },
        {
          code: 'DUPLICATE_SKU',
          level: 'red',
          message: 'Duplicate SKU detected.',
        },
      ]),
    ).toBe('red');
  });
});
