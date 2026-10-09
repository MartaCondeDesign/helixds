import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@helixds/tokens/helix.css';
import '@helixds/react/globals.css';
import App from './App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
