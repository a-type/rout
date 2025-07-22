import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export * from './v1/attributes.js';
export { ballparkData, type BallparkType } from './v1/data/ballparkData.js';
export { classData, classIcons } from './v1/data/classData.js';
export { itemData } from './v1/data/itemData.js';
export { perks, type PerkEffect } from './v1/data/perkData.js';
export type { ActualPitch, PitchData } from './v1/data/pitchData.js';
export { speciesData, speciesIcons } from './v1/data/speciesData.js';
export { statusData, type StatusType } from './v1/data/statusData.js';
export { weather, type WeatherType } from './v1/data/weatherData.js';
export {
  canAssignToPosition,
  getInningInfo,
  hasPitcherPosition,
  isPitcher,
  sum,
  sumObjects,
} from './v1/utils.js';

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
  devPort: 3303,
} satisfies GameModule;

export { v1 };

export * from './v1/gameTypes.js';
