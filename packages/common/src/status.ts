import { PrefixedId } from './ids';

export interface GameSessionPlayerStatus {
  online: boolean;
}

export type GameStatus =
  | {
      status: 'pending';
    }
  | {
      status: 'active';
    }
  | {
      status: 'complete';
      winnerIds: PrefixedId<'u'>[];
    };

export type GameStatusValue = GameStatus['status'];
