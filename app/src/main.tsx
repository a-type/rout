import { setColorMode } from '@a-type/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

import '@long-game/game-ui/css.css';
import 'virtual:uno.css';
import './main.css';
import { attachToPwaEvents } from './pwaEvents.js';

function main() {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

main();

// default to dark mode
if (
  typeof window !== 'undefined' &&
  !window.localStorage.getItem('colorMode')
) {
  setColorMode('dark');
}

attachToPwaEvents();
