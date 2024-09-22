import {
  MoveData as NGTurnData,
  PlayerState as NGPlayerState,
} from './gameDefinition.ts';

declare module '@long-game/client/client' {
  export interface GameSessionTypes {
    TurnData: NGTurnData;
    PlayerState: NGPlayerState;
  }
}
