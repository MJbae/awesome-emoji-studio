import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@emoji/shared';
import '@emoji/shared/css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
