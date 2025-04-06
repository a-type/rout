import { type ValidCardId } from './cardDefinition';

type DeckDefinition = {
  name: string;
  list: ValidCardId[];
};

export const deckDefinitions: Record<string, DeckDefinition> = {
  deck1: {
    name: 'Deck 1',
    list: [
      ...Array.from({ length: 5 }, (_, i) => 'solaran-soldier-3' as const),
      ...Array.from({ length: 5 }, (_, i) => 'solaran-soldier-2' as const),
      ...Array.from({ length: 10 }, (_, i) => 'solaran-soldier-1' as const),
    ],
  },
};
