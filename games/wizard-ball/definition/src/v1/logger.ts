import { GameLogEvent, LeagueGameState } from './gameTypes';

type LoggerMode = 'state' | 'console' | 'none';
type LogLevel = 'info' | 'debug';

class Logger {
  private _mode: LoggerMode;
  private _level: LogLevel;

  constructor(mode: LoggerMode = 'state', level: LogLevel = 'info') {
    this._mode = mode;
    this._level = level;
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

  public debug(data: any): void {
    if (this._mode === 'console') {
      console.log(data);
    }
  }

  public info(data: any): void {
    if (this._mode === 'console' && this._level === 'info') {
      console.log(data);
    }
  }
}

export const logger = new Logger('state');

export default Logger;
