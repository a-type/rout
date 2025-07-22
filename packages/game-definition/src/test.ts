/**
 * Testing utils
 */

import { colors, PlayerColorName } from '@long-game/common';
import { GameMember } from './gameDefinition.js';

export function testPlayer(index: number): GameMember {
  return {
    id: `u-${index}`,
    displayName: `Player ${index}`,
    color: Object.keys(colors)[
      index % Object.keys(colors).length
    ] as PlayerColorName,
  };
}
