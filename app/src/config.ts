export const API_ORIGIN =
  import.meta.env.VITE_PUBLIC_API_ORIGIN || 'localhost:3101';
export const SECURE =
  typeof window !== 'undefined' && window.location.protocol === 'https:';
export const UI_ORIGIN = import.meta.env.BASE_URL;
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
