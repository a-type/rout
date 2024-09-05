import { GameRound } from '@long-game/common';
import { GameSession } from '@long-game/db';
import {
  GameDefinition,
  Turn,
  GameRandom,
  GameStatus,
} from '@long-game/game-definition';

export type RequiredGameSession = Pick<
  GameSession,
  | 'id'
  | 'gameId'
  | 'initialState'
  | 'timezone'
  | 'randomSeed'
  | 'gameVersion'
  | 'startedAt'
>;

export class GameSessionState {
  constructor(
    private gameSession: RequiredGameSession,
    public readonly gameDefinition: GameDefinition,
    public turns: {
      createdAt: string;
      data: any;
      userId: string;
      roundIndex: number;
    }[],
    readonly members: { id: string }[],
  ) {}

  get id(): string {
    return this.gameSession.id;
  }

  get globalState(): any {
    if (!this.gameSession.startedAt)
      return this.gameDefinition.getInitialGlobalState({
        random: new GameRandom(this.gameSession.randomSeed),
        members: this.members,
      });

    // only apply previous round moves! current round hasn't
    // yet been settled
    return this.gameDefinition.getState({
      initialState: this.gameSession.initialState,
      rounds: this.previousRounds,
      random: new GameRandom(this.gameSession.randomSeed),
      members: this.members,
    });
  }

  get rounds(): GameRound<Turn<any>>[] {
    if (!this.gameSession.startedAt) return [];

    return this.turns.reduce<GameRound<Turn<any>>[]>((acc, turn) => {
      const round: GameRound<Turn<any>> = acc[turn.roundIndex] ?? {
        roundIndex: turn.roundIndex,
        turns: [],
      };

      round.turns.push({
        ...turn,
        data: turn.data,
      });

      acc[turn.roundIndex] = round;

      return acc;
    }, []);
  }

  get currentRoundIndex(): number {
    if (!this.gameSession.startedAt) return 0;

    return this.gameDefinition.getRoundIndex({
      currentTime: new Date(),
      gameTimeZone: this.gameSession.timezone,
      members: this.members,
      startedAt: new Date(this.gameSession.startedAt),
      turns: this.turns,
    });
  }

  get previousRounds(): GameRound<Turn<any>>[] {
    return this.rounds.filter(
      (round) => round.roundIndex < this.currentRoundIndex,
    );
  }

  get currentRound(): GameRound<Turn<any>> {
    return (
      this.rounds[this.currentRoundIndex] || {
        turns: [],
        roundIndex: this.currentRoundIndex,
      }
    );
  }

  get status(): GameStatus {
    if (!this.gameSession.startedAt)
      return {
        status: 'pending',
      };

    return this.gameDefinition.getStatus({
      globalState: this.globalState,
      members: this.members,
      rounds: this.previousRounds,
    });
  }

  addTurn(turn: Turn<any>) {
    this.turns.push(turn);
  }
}
