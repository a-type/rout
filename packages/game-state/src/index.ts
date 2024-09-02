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

export interface GameSessionState {
  globalState: any;
  rounds: GameRound<Turn<any>>[];
  previousRounds: GameRound<Turn<any>>[];
  currentRound: GameRound<Turn<any>>;
  gameDefinition: GameDefinition;
  members: { id: string }[];
}

export async function getGameState(
  gameSession: RequiredGameSession,
  currentTime: Date,
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

  // group by roundIndex
  const rounds = turns.reduce<GameRound<Turn<any>>[]>((acc, turn) => {
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

  const currentRoundIndex = gameDefinition.getRoundIndex({
    currentTime,
    gameTimeZone: gameSession.timezone,
    members,
    startedAt: new Date(gameSession.startedAt),
    turns,
  });

  const previousRounds = rounds.filter(
    (round) => round.roundIndex < currentRoundIndex,
  );

  // only apply previous round moves! current round hasn't
  // yet been settled
  const globalState = gameDefinition.getState({
    initialState: gameSession.initialState,
    rounds: previousRounds,
    random: new GameRandom(gameSession.randomSeed),
    members,
  });

  const currentRound: GameRound<Turn<any>> = rounds[currentRoundIndex] || {
    turns: [],
    roundIndex: currentRoundIndex,
  };

  return {
    previousRounds,
    currentRound,
    rounds,
    globalState,
    gameDefinition,
    members,
  };
}
