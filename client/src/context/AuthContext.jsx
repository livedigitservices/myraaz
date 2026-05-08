import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(
    JSON.parse(localStorage.getItem('userInfo')) || null
  );

  const login  = (data) => { setUserInfo(data); localStorage.setItem('userInfo', JSON.stringify(data)); };
  const logout = ()     => { setUserInfo(null);  localStorage.removeItem('userInfo'); };

  return (
    <AuthContext.Provider value={{ userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);