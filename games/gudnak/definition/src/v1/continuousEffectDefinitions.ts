import { GlobalState } from './gameDefinition';

// TODO: Consider renaming ability effects
export type ContinuousEffectDefinition = {
  description: string;
  validate?: {
    defend?: () => boolean;
  };
  apply?: {
    combat?: (globalState: GlobalState) => GlobalState;
  };
};

export const continuousEffectDefinitions = {
  'cant-be-attacked': {
    description: 'This fighter cannot be attacked.',
    validate: {
      defend: () => false,
    },
  },
} satisfies Record<string, ContinuousEffectDefinition>;

export type ValidContinuousEffectKey = keyof typeof continuousEffectDefinitions;
