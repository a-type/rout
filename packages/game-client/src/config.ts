export const SECURE =
  typeof window !== 'undefined' && window.location.protocol === 'https:';
export const API_ORIGIN =
  import.meta.env.PUBLIC_API_ORIGIN || 'http://localhost:3101';
export const HOME_ORIGIN = import.meta.env.BASE_URL || 'http://localhost:3100';

declare global {
  interface ImportMeta {
    env: any;
  }
}
