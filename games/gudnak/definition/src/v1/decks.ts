import { type ValidCardId } from './cardDefinition';

type DeckDefinition = {
  name: string;
  list: ValidCardId[];
};

export const deckDefinitions: Record<string, DeckDefinition> = {
  deck1: {
    name: 'Refractory Mobility',
    list: [
      'solaran-soldier-3',
      ...Array.from({ length: 2 }, (_, i) => 'solaran-soldier-2' as const),
      ...Array.from({ length: 2 }, (_, i) => 'solaran-soldier-1' as const),
      'dusklight-hunter-2',
      'dusklight-hunter-1',
      'dawnbringer-brute-3',
      'dawnbringer-brute-2',
      // heroes
      'solaran-cavalry',
      'bullgryff-rider',
      'bullgryff',
      'standardbearer',
      'battle-cleric-of-solara',
      // tactics
      'tempo',
      'reposition',
      'forced-march',
      'rapid-deployment',
    ],
  },
};
