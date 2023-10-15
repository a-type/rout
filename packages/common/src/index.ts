export type GameSession = {
  id: string;
  gameId: string;
};

export type PlayerSession = {
  id: string;
  gameSessionId: string;
  playerId: string;
};
