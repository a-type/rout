import { GameRound } from '@long-game/common';
import { GameSession, PrefixedId } from '@long-game/db';
import {
  GameDefinition,
  GameRandom,
  GameStatus,
  Turn,
} from '@long-game/game-definition';

export type RequiredGameSession = Pick<
  GameSession,
  'id' | 'gameId' | 'timezone' | 'randomSeed' | 'gameVersion' | 'startedAt'
>;

export class GameSessionState {
  constructor(
    private gameSession: RequiredGameSession,
    public readonly gameDefinition: GameDefinition,
    public turns: {
      createdAt: string;
      data: any;
      playerId: PrefixedId<'u'>;
      roundIndex: number;
    }[],
    readonly members: { id: PrefixedId<'u'> }[],
  ) {}

  get id(): `gss-${string}` {
    return this.gameSession.id.replace('gs-', 'gss-') as any;
  }

  get globalState(): any {
    const random = new GameRandom(this.gameSession.randomSeed);
    const initialState = this.gameDefinition.getInitialGlobalState({
      random,
      members: this.members,
    });

    // only apply previous round moves! current round hasn't
    // yet been settled
    return this.gameDefinition.getState({
      initialState,
      rounds: this.previousRounds,
      random,
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

  getPlayerStateAtRound({
    playerId,
    roundIndex,
  }: {
    playerId: string;
    roundIndex: number;
  }) {
    const random = new GameRandom(this.gameSession.randomSeed);
    // only compute using previous (settled) rounds. we never
    // want to leak future information to players, and players will
    // calculate the prospective state themselves using their own info.
    const rounds = this.previousRounds.filter(
      (round) => round.roundIndex <= roundIndex,
    );
    const globalState = this.gameDefinition.getState({
      initialState: this.gameDefinition.getInitialGlobalState({
        random,
        members: this.members,
      }),
      members: this.members,
      random,
      rounds,
    });
    return this.gameDefinition.getPlayerState({
      globalState,
      playerId,
      roundIndex,
      members: this.members,
      rounds,
    });
  }

  getHasPlayedTurn(playerId: string) {
    return this.currentRound.turns.some((turn) => turn.playerId === playerId);
  }
}
