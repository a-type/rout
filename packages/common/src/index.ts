export type GameSession = {
  id: string;
  gameId: string;
};

export type PlayerSession = {
  id: string;
  gameSessionId: string;
  playerId: string;
};

export type Session = {
  userId: string;
  gameId: string;
  gameSessionId: string;
  createdAt: Date;
};

export * from './rounds.js';
