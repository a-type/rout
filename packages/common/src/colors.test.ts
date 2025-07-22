import { describe, expect, it } from 'vitest';
import { deduplicatePlayerColors, PlayerColorName } from './colors.js';

describe('player colors', () => {
  it('deduplicates assigned colors', () => {
    const members: { color: PlayerColorName }[] = [
      {
        color: 'red',
      },
      {
        color: 'blue',
      },
      {
        color: 'teal',
      },
      {
        color: 'red',
      },
      {
        color: 'teal',
      },
    ];
    expect(deduplicatePlayerColors(members)).toMatchInlineSnapshot(`
      [
        {
          "color": "red",
        },
        {
          "color": "blue",
        },
        {
          "color": "teal",
        },
        {
          "color": "crimson",
        },
        {
          "color": "plum",
        },
      ]
    `);
  });
});
