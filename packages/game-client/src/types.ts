import { Inputs, Outputs } from '@long-game/trpc';

export type GameSessionData = Outputs['gameSessions']['gameSession'];
export type GameSessionMembershipData =
  Outputs['gameSessions']['gameMemberships'][0];
