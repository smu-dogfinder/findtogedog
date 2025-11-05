import React from 'react';
import { Link, RouterProvider, BrowserRouter } from 'react-router-dom';
import App from '@/App.jsx';
import '@/index.css';
import { createRoot } from 'react-dom/client';

import { LoginContextProvider } from '@/contexts/LoginContext.jsx';
import { InquiryContextProvider } from '@/contexts/InquiryContext.jsx';
import { NoticeContextProvider } from '@/contexts/NoticeContext.jsx';

import axios from 'axios';
import Cookies from 'js-cookie';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

axios.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 안전하게 검사!
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post('/auth/refresh');

        if (res.status === 200) {
          const newAccessToken = res.data.accessToken;

          Cookies.set('token', newAccessToken, { expires: 1 });
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token is invalid or expired.", refreshError);
        Cookies.remove('token');
        Cookies.remove('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);



createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <LoginContextProvider>
        <InquiryContextProvider>
          <NoticeContextProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
          </NoticeContextProvider>
        </InquiryContextProvider>
      </LoginContextProvider>
  </React.StrictMode>
);
