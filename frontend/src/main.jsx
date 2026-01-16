import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Apply theme immediately before React renders to prevent flash
// Default to light mode if no saved preference
const savedTheme = localStorage.getItem('theme');
const theme = savedTheme || 'light';
document.documentElement.classList.add(theme);
// Ensure theme is saved to localStorage
if (!savedTheme) localStorage.setItem('theme', 'light');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
