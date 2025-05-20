// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../socket';   // ← import our socket connector

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // 1) Track token in state (and localStorage)
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(!!token);

  // 2) On mount / when token changes, connect socket + fetch user
  useEffect(() => {
    if (token) {
      connectSocket();           // ← open socket connection with token in auth payload
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  // 3) Fetch /auth/me
  const fetchUserInfo = async tok => {
    try {
      const res = await fetch('http://192.168.88.124:5000/auth/me', {
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (!res.ok) throw new Error('Unauthorized');
      const userData = await res.json();
      setUser({
        id:       userData.id,
        name:     userData.name,
        username: userData.username,
        email:    userData.email,
        phone:    userData.phone,
        dob:      userData.dob,
        role:     userData.role,
        avatar:   userData.avatar,
        bio:      userData.bio,
        company:  userData.company || null
      });
    } catch (err) {
      console.error('AuthContext fetch error:', err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 4) login() for both email/password & Google
  const login = async (emailOrData, password) => {
    try {
      let newToken;

      if (typeof emailOrData === 'object' && emailOrData.token) {
        // Google flow
        newToken = emailOrData.token;
      } else {
        // Email/password
        const res = await fetch('http://192.168.88.124:5000/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: emailOrData, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        newToken = data.token;
      }

      // persist
      localStorage.setItem('token', newToken);
      setToken(newToken);

      // open socket & fetch user
      connectSocket();
      await fetchUserInfo(newToken);

      // navigate once we have user
      navigate('/profile', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  // 5) logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  // 6) manual refresh if needed
  const refreshUser = async () => {
    if (token) await fetchUserInfo(token);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
