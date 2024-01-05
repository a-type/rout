export const DEPLOYED_CONTEXT = {
  apiHost:
    process.env.HOST ||
    (process.env.PORT
      ? `http://localhost:${process.env.PORT}`
      : `http://localhost:3101`) ||
    'http://localhost:3101',
  uiHost: process.env.UI_HOST || 'http://localhost:3100',
};
