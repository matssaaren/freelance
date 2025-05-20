import { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (token) => {
  try {
    const res = await fetch('http://localhost:5000/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Unauthorized');
    }

    const userData = await res.json();

    // ✅ Destructure safely
    setUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      dob: userData.dob,
      role: userData.role,
      avatar: userData.avatar,
      bio: userData.bio,
      company: userData.company || null, // <- 🟢 this makes sure it's always available
    });

  } catch (error) {
    console.error('AuthContext fetch error:', error);
    localStorage.removeItem('token');
    setUser(null);
  } finally {
    setLoading(false);
  }
};


  // 🔥 Add refreshUser function (public)
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchUserInfo(token);
    }
  };

  const login = async (emailOrData, password) => {
    try {
      let token;
  
      if (typeof emailOrData === 'object' && emailOrData.token) {
        // Google login
        token = emailOrData.token;
      } else {
        // Email/password login
        const res = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailOrData, password }),
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          throw new Error(data.error || 'Login failed');
        }
  
        token = data.token;
      }
  
      localStorage.setItem('token', token);
      await fetchUserInfo(token);
      navigate('/profile');
    } catch (error) {
      throw error;
    }
  };
  

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}