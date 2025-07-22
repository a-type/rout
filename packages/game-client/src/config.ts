export const SECURE =
  typeof window !== 'undefined' && window.location.protocol === 'https:';
export const API_ORIGIN =
  window.LONG_GAME_CONFIG.API_ORIGIN || 'http://localhost:3101';
export const HOME_ORIGIN =
  window.LONG_GAME_CONFIG.UI_ORIGIN || 'http://localhost:3100';

declare global {
  interface Window {
    LONG_GAME_CONFIG: {
      API_ORIGIN: string;
      UI_ORIGIN: string;
    };
  }
}
