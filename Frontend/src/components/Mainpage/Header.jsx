import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginContext } from "@/contexts/LoginContext";

export default function Header() {
  const { login, user, logout } = useContext(LoginContext);
  const navigate = useNavigate();

  const linkStyle = {
    padding: '0.5rem',
    color: '#333',
    textDecoration: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'color 0.2s, background-color 0.2s',
  };

  const onEnter = (e) => {
    e.target.style.color = '#000';
    e.target.style.backgroundColor = '#f0f0f0';
    e.target.style.borderRadius = '4px';
  };
  const onLeave = (e) => {
    e.target.style.color = '#333';
    e.target.style.backgroundColor = 'transparent';
    e.target.style.borderRadius = '0px';
  };

  const handleLogout = () => {
    logout();        
    navigate("/");  
  };

  return (
    <div style={{
      background: '#fff',
      padding: '1rem',
      borderBottom: '1px solid #ccc',
      height: '100px',
      position: 'relative'
    }}>
      {/* 제목/로고 */}
      <h1 style={{
        margin: 0,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '2.8rem',
        fontFamily: 'Jua'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <img
            src="/imageupload/mainlogo.png"   // ✅ /public 접두사는 필요 없음
            alt="함께찾개 로고"
            style={{ marginTop: '1rem', height: '120px', objectFit: 'contain' }}
          />
        </Link>
      </h1>

      {/* 오른쪽 메뉴 */}
      <div style={{
        position: 'absolute',
        right: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {!login ? (
          <>
            <a href="/login" style={linkStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
              로그인
            </a>
            |
            <a href="/signup" style={linkStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
              회원가입
            </a>
          </>
        ) : (
          <>
            <span style={ linkStyle }>
              {user?.nickName ?? '사용자'}님
            </span>
            |
            <span
              style={linkStyle}
              onClick={handleLogout}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              로그아웃
            </span>
          </>
        )}
      </div>
    </div>
  );
}
