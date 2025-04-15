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
      status: 'completed';
      winnerIds: string[];
    };

export type GameStatusValue = GameStatus['status'];
