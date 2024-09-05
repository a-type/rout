import { GameRound } from '@long-game/common';
import { GameSession, db } from '@long-game/db';
import { GameDefinition, Turn, GameRandom } from '@long-game/game-definition';
import games from '@long-game/games';

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

export async function getGameState(
  gameSession: RequiredGameSession,
): Promise<null | GameSessionState> {
  const turns = await db
    .selectFrom('GameTurn')
    .where('gameSessionId', '=', gameSession.id)
    .select(['data', 'userId', 'createdAt', 'roundIndex'])
    .orderBy('createdAt', 'asc')
    .execute();
  const members = await db
    .selectFrom('GameSessionMembership')
    .where('gameSessionId', '=', gameSession.id)
    .select(['userId as id'])
    .execute();

  const game = games[gameSession.gameId];
  if (!game) {
    throw new Error('Game not found');
  }

  const gameDefinition = game.versions.find(
    (g) => g.version === gameSession.gameVersion,
  );

  if (!gameDefinition) {
    throw new Error(
      `No game rules found for version ${gameSession.gameVersion} of game ${gameSession.gameId}`,
    );
  }

  return new GameSessionState(gameSession, gameDefinition, turns, members);
}

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

  get status() {
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
