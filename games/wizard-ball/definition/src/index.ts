import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export { speciesIcons, speciesData } from './v1/speciesData';
export { classIcons, classData } from './v1/classData';
export { perks, type PerkEffect } from './v1/perkData';
export * from './v1/attributes';
export {
  getInningInfo,
  sumObjects,
  sum,
  isPitcher,
  canAssignToPosition,
} from './v1/utils';
export { itemData } from './v1/itemData';
export { weather, type WeatherType } from './v1/weatherData';
export { ballparkData, type BallparkType } from './v1/ballparkData';
export { statusData, type StatusType } from './v1/statusData';
export type { PitchData, ActualPitch } from './v1/pitchData';

export default {
  id: 'wizard-ball',
  title: 'wizard-ball',
  versions: [v1],
  tags: [],
  creators: [
    {
      name: 'Zack',
    },
  ],
} satisfies GameModule;

export { v1 };

export * from './v1/gameTypes';
