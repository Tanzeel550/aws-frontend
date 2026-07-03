import React, { useState } from 'react';
import api from '../api';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login endpoint
        const response = await api.post('/users/login/', {
          email,
          password,
        });
        
        const { access, refresh } = response.data;
        onAuthSuccess(access, email);
      } else {
        // Signup endpoint
        await api.post('/users/register/', {
          email,
          password,
        });
        
        // Log user in automatically after successful registration
        const loginResponse = await api.post('/users/login/', {
          email,
          password,
        });
        const { access } = loginResponse.data;
        onAuthSuccess(access, email);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        // Parse Django API errors
        const data = err.response.data;
        if (data.email) {
          setError(Array.isArray(data.email) ? data.email[0] : data.email);
        } else if (data.password) {
          setError(Array.isArray(data.password) ? data.password[0] : data.password);
        } else if (data.detail) {
          setError(data.detail);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Authentication failed. Please check your credentials.');
        }
      } else {
        setError('Server connection error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', marginBottom: '1rem', color: '#8b5cf6' }}>
            <Sparkles size={24} />
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Enter your details to classify digits' : 'Register to start testing handwritten digits'}</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                placeholder="you@example.com"
                className="input-control"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-control"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-control"
                  style={{ paddingLeft: '38px' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', height: '44px' }}
            disabled={loading}
          >
            {loading ? (
              <span className="loader-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', marginBottom: 0 }}></span>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                Sign In
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={toggleAuthMode} className="btn-secondary auth-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
