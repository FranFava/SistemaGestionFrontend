import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          setUser(userObj);
        } catch {
          localStorage.removeItem('user');
        }
      }

      try {
        const { data } = await authService.validate();
        if (data.usuario) {
          localStorage.setItem('user', JSON.stringify(data.usuario));
          setUser(data.usuario);
        } else if (!storedUser) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            setUser(userObj);
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    const { data } = await authService.login(username, password);
    
    if (data.token && data.usuario) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
      setUser(data.usuario);
      return data;
    } else {
      throw new Error('Respuesta de login inválida');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);