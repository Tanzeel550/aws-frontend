import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');

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
        <Dashboard token={token} email={email} onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}
