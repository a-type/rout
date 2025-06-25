import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export * from './v1/attributes';
export { ballparkData, type BallparkType } from './v1/ballparkData';
export { classData, classIcons } from './v1/classData';
export { itemData } from './v1/itemData';
export { perks, type PerkEffect } from './v1/perkData';
export type { ActualPitch, PitchData } from './v1/pitchData';
export { speciesData, speciesIcons } from './v1/speciesData';
export { statusData, type StatusType } from './v1/statusData';
export {
  canAssignToPosition,
  getInningInfo,
  hasPitcherPosition,
  isPitcher,
  sum,
  sumObjects,
} from './v1/utils';
export { weather, type WeatherType } from './v1/weatherData';

export default {
  id: 'wizard-ball',
  title: 'Wizard Ball',
  description:
    'A baseball simulation game set in a fantasy world where woodland creatures play baseball.',
  versions: [v1],
  tags: ['simulation', 'sports', 'competitive'],
  creators: [
    {
      name: 'Zack',
    },
  ],
  prerelease: true,
} satisfies GameModule;

export { v1 };

export * from './v1/gameTypes';
