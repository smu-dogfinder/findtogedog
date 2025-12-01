import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie'; // ✅ 쿠키 사용 추가
import { LoginContext } from "@/contexts/LoginContext";
import {
  containerStyle,
  boxStyle,
  titleStyle,
  formStyle,
  labelStyle,
  inputStyle,
  buttonStyle,
  errorStyle,
  footerStyle
} from '../../styles/AuthFormStyles';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, setLogin, setUser } = useContext(LoginContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await axios.post('/auth/login', {
        userid,
        password,
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        withCredentials: true, // ✅ refresh_token 쿠키 전송을 위함
      });

      const { accessToken, user } = res.data;

      // 로그인 성공 시 localStorage에 autoLogin=true 저장
      //localStorage.setItem('autoLogin', 'true');
      //localStorage.setItem('accessToken', accessToken);
      //localStorage.setItem('user', JSON.stringify(user));

      Cookies.set('token', accessToken, { expires: 1 });
      Cookies.set('user', JSON.stringify(user), { expires: 1 });

      setUser(user);
      setLogin(true);
      navigate('/');

      // ✅ 4. 리디렉션
    } catch (err) {
      console.error(err);
      setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  // 로그인 상태면 로그인 페이지 접근 막고 홈으로 이동
  useEffect(() => {
    if (login) navigate("/");
  }, [login, navigate]);

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>로그인</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>아이디</label>
          <input
            type="text"
            required
            value={userid}
            onChange={(e) => setUserid(e.target.value)}
            style={inputStyle}
            placeholder="아이디를 입력하세요"
          />

          <label style={labelStyle}>비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="비밀번호를 입력하세요"
          />

          {errorMsg && <p style={errorStyle}>{errorMsg}</p>}

          <button type="submit" style={buttonStyle}>로그인</button>
        </form>

        <div style={footerStyle}>
          <a href="/signup">회원가입</a> | <a href="/findpassword">비밀번호 찾기</a>
        </div>
      </div>
    </div>
  );
}
