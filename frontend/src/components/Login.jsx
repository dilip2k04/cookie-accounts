import { useState } from 'react';
import axios from 'axios';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', { email, password }, { withCredentials: true });
      localStorage.setItem('accessToken', res.data.accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data.error || 'Login failed');
    }
  };

  const isMobile = window.innerWidth < 768;
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6'
  };
  const cardStyle = {
    backgroundColor: '#FFFFFF',
    padding: isMobile ? '1.5rem' : '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: isMobile ? '90%' : '24rem',
    maxWidth: '90%'
  };
  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginBottom: '1rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.375rem',
    outline: 'none',
    transition: 'all 0.2s'
  };
  const buttonStyle = {
    width: '100%',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#1F2937'
        }}>Cookie Login</h2>
        {error && (
          <p style={{
            color: '#EF4444',
            marginBottom: '1rem',
            textAlign: 'center',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>{error}</p>
        )}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={inputStyle}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={inputStyle}
            required
          />
          <button
            type="submit"
            style={buttonStyle}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;