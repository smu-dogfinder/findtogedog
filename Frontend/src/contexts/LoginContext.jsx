// src/contexts/LoginContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

export const LoginContext = createContext({
  login: false,
  setLogin: () => {},
  user: null,
  setUser: () => {},
  logout: () => {},
});

export function LoginContextProvider({ children }) {
  const [login, setLogin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = Cookies.get('token');
    const userCookie = Cookies.get('user');
    //const autoLogin = localStorage.getItem('autoLogin') === 'true';
    const autoLogin = Cookies.get('autoLogin') === 'true'; 

    if (token && userCookie) {
      try {
        setUser(JSON.parse(userCookie));
        setLogin(true);
        return;
      } catch {
        setUser(null);
        setLogin(false);
      }
    } 
    
    if (!autoLogin) return;
    
    
    const tryRefresh = async () => {
      try {
        const res = await axios.post('/auth/refresh', {}, {
          withCredentials: true,
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });

        const { accessToken } = res.data;
        if (accessToken) {
          Cookies.set('token', accessToken, { expires: 1 });

          const userRes = await axios.get('/api/mypage/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const userData = userRes.data;
          Cookies.set('user', JSON.stringify(userData), { expires: 1 });

          setUser(userData);
          setLogin(true);
        }
      } catch (err) {
        console.error('자동 로그인 실패:', err);
        logout();
      }
    };

    tryRefresh();
  }, []);



  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    //localStorage.removeItem('autoLogin');
    //localStorage.removeItem('accessToken');
    //localStorage.removeItem('user');
    Cookies.remove('autoLogin');
    setUser(null);
    setLogin(false);
    axios.post('/auth/logout', {}, { withCredentials: true }).catch(() => {});
  };

  return (
    <LoginContext.Provider value={{ login, setLogin, user, setUser, logout }}>
      {children}
    </LoginContext.Provider>
  );
}

export const useLogin = () => useContext(LoginContext);
