import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

// Theme configuration: set to 'light' or 'dark' to control the application theme
export const APP_THEME = 'light';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [theme, setTheme] = useState(APP_THEME);

  // Sync theme changes if the config variable changes in the code
  useEffect(() => {
    setTheme(APP_THEME);
  }, [APP_THEME]);

  // Apply theme class to document element on theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
    } else {
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Persist authentication tokens
  const handleAuthSuccess = (accessToken, userEmail) => {
    setToken(accessToken);
    setEmail(userEmail);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('email', userEmail);
  };

  const handleLogout = () => {
    setToken('');
    setEmail('');
    localStorage.removeItem('token');
    localStorage.removeItem('email');
  };

  return (
    <>
      {token ? (
        <Dashboard token={token} email={email} onLogout={handleLogout} theme={theme} onToggleTheme={handleToggleTheme} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} theme={theme} onToggleTheme={handleToggleTheme} />
      )}
    </>
  );
}
