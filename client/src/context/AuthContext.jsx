import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

/**
 * Parses a JWT and returns its payload, or null if invalid/expired.
 * NOTE: localStorage JWTs are vulnerable to XSS. For a production app handling
 * sensitive payments, consider httpOnly cookie tokens. This is the pattern used
 * throughout this codebase, so we keep it consistent while adding expiry detection.
 */
const parseJwt = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  return Date.now() / 1000 > payload.exp;
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Auto-clear if token is expired
    if (user?.token && isTokenExpired(user.token)) {
      localStorage.removeItem('userInfo');
      return null;
    }
    return user;
  } catch {
    localStorage.removeItem('userInfo');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(getStoredUser);

  const login = useCallback((data) => {
    setUserInfo(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setUserInfo(null);
    localStorage.removeItem('userInfo');
  }, []);

  return (
    <AuthContext.Provider value={{ userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};