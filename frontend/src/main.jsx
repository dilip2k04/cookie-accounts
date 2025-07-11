// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Ensure this import is present

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);