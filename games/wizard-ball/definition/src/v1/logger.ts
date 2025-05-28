import { GameLogEvent, LeagueGameState } from './gameTypes';

type LoggerMode = 'state' | 'console' | 'none';

class Logger {
  private _mode: LoggerMode;

  constructor(mode: LoggerMode = 'state', filename?: string) {
    this._mode = mode;
  }

  public addToGameLog(
    event: GameLogEvent,
    gameState: LeagueGameState,
  ): LeagueGameState {
    switch (this._mode) {
      case 'console':
        console.log(event);
        return gameState;
      case 'state':
        return { ...gameState, gameLog: [...gameState.gameLog, event] };
      case 'none':
      default:
        return gameState;
    }
  }
}

export default Logger;
