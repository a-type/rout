export const SECURE =
  typeof window !== 'undefined' && window.location.protocol === 'https:';
export const API_ORIGIN =
  import.meta.env.VITE_PUBLIC_API_ORIGIN || 'http://localhost:3101';
export const HOME_ORIGIN =
  import.meta.env.VITE_HOME_ORIGIN || 'http://localhost:3100';

declare global {
  interface ImportMetaEnv {
    VITE_PUBLIC_API_ORIGIN: string;
    VITE_GAME_SESSION_API_ORIGIN: string;
    VITE_HOME_ORIGIN: string;
    DEV: boolean;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
