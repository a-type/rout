import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './services/federation.js';

import '@a-type/ui/main.css';
import './main.css';

import './swRegister.js';

function main() {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

main();
