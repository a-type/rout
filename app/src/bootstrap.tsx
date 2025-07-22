import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

import 'uno.css';
import './main.css';
import { attachToPwaEvents } from './pwaEvents.js';
import { registerServiceWorker } from './swRegister.js';

function main() {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

main();

registerServiceWorker().then(() => {
  attachToPwaEvents();
});
