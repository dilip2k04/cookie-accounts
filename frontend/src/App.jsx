// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

axios.defaults.baseURL = 'https://cookie-accounts-backend.onrender.com/api';
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/me').then(res => setUser(res.data.user)).catch(() => localStorage.removeItem('token'));
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
