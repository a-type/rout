import { expect, it } from 'vitest';
import { splitChatTokens } from './chat';

it('splits chat tokens correctly', () => {
  const text = 'Hello {{!player:u123:name}}, welcome to {{!game:g456:title}}!';
  const parts = splitChatTokens(text);
  expect(parts).toEqual([
    'Hello ',
    { type: 'player', value: 'u123', role: 'name' },
    ', welcome to ',
    { type: 'game', value: 'g456', role: 'title' },
    '!',
  ]);
});
