export const API_ORIGIN =
  import.meta.env.VITE_PUBLIC_API_ORIGIN || 'localhost:3101';
export const SECURE =
  typeof window !== 'undefined' && window.location.protocol === 'https:';
export const UI_ORIGIN = import.meta.env.VITE_PUBLIC_URL;
export const GAME_SESSION_API_ORIGIN = import.meta.env
  .VITE_GAME_SESSION_API_ORIGIN;

export const APP_NAME = 'Long Game';
