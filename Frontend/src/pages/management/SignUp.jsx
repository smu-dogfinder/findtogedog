import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  containerStyle,
  boxStyle,
  titleStyle,
  formStyle,
  labelStyle,
  inputStyle,
  buttonStyle,
  errorStyle,
  successStyle,
  footerStyle
} from '../../styles/AuthFormStyles';

export default function Signup() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');

  // 유효성/상태
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 중복 체크 상태
  const [isNicknameTaken, setIsNicknameTaken] = useState(false);
  const [isEmailTaken, setIsEmailTaken] = useState(false);
  const [isUseridTaken, setIsUseridTaken] = useState(false);

  // 팝업
  const [showPopup, setShowPopup] = useState(false);

  const navigate = useNavigate();

  // ===== 클라 유효성 검사 =====
  const validate = () => {
    const newErrors = {};

    if (!nickname.trim() || nickname.length < 3)
      newErrors.nickname = '닉네임은 최소 3글자 이상이어야 합니다.';

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';

    if (!userid.trim() || userid.length < 4)
      newErrors.userid = '아이디는 최소 4글자 이상이어야 합니다.';

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':",.<>/?\\|]).{8,}$/;
    if (!password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (!passwordRegex.test(password))
      newErrors.password =
        '비밀번호는 영문 대문자, 숫자, 특수기호를 포함한 8자 이상이어야 합니다.';

    if (password !== passwordCheck)
      newErrors.passwordCheck = '비밀번호가 일치하지 않습니다.';

    // 서버 중복 체크 결과도 함께 반영
    if (isNicknameTaken) newErrors.nickname = '이미 사용 중인 닉네임입니다.';
    if (isEmailTaken) newErrors.email = '이미 사용 중인 이메일입니다.';
    if (isUseridTaken) newErrors.userid = '이미 사용 중인 아이디입니다.';

    return newErrors;
  };

  // ===== 입력 핸들러(실시간 에러 완화) =====
  const handleChange = (field, value) => {
    switch (field) {
      case 'nickname':
        setNickname(value);
        setIsNicknameTaken(false);
        if (errors.nickname && value.length >= 3)
          setErrors((prev) => ({ ...prev, nickname: undefined }));
        break;
      case 'email':
        setEmail(value);
        setIsEmailTaken(false);
        if (errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          setErrors((prev) => ({ ...prev, email: undefined }));
        break;
      case 'userid':
        setUserid(value);
        setIsUseridTaken(false);
        if (errors.userid && value.length >= 6)
          setErrors((prev) => ({ ...prev, userid: undefined }));
        break;
      case 'password':
        setPassword(value);
        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
        break;
      case 'passwordCheck':
        setPasswordCheck(value);
        if (errors.passwordCheck && value === password)
          setErrors((prev) => ({ ...prev, passwordCheck: undefined }));
        break;
      default:
        break;
    }
  };

  // ===== 서버 중복 체크 (blur 시 호출) =====
  const checkDuplicateNickname = async () => {
    if (!nickname.trim()) return;
    try {
      const res = await fetch(
        `/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      const isAvailable = await res.json(); // 서버가 true/false 반환한다고 가정
      setIsNicknameTaken(!isAvailable);
    } catch (e) {
      console.error('닉네임 중복 확인 실패', e);
    }
  };

  const checkDuplicateEmail = async () => {
    if (!email.trim()) return;
    try {
      const res = await fetch(
        `/auth/check-email?email=${encodeURIComponent(email)}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      const isAvailable = await res.json();
      setIsEmailTaken(!isAvailable);
    } catch (e) {
      console.error('이메일 중복 확인 실패', e);
    }
  };

  const checkDuplicateUserid = async () => {
    if (!userid.trim()) return;
    try {
      const res = await fetch('/auth/check-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userid }),
      });
      const { exists } = await res.json();
      setIsUseridTaken(exists);
    } catch (e) {
      console.error('아이디 중복 확인 실패', e);
    }
  };

  // ===== 제출 =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrors({});

    // 마지막으로 유효성 검사
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          nickname,
          userid,
          password,
          email
        })
      });

      if (!res.ok) throw new Error('회원가입 실패');

      // 성공 처리: 팝업 → 2초 뒤 로그인 페이지로 이동
      setShowPopup(true);
      setSuccessMsg('회원가입 성공! 잠시 후 로그인 페이지로 이동합니다.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err);
      setErrors({ general: '회원가입 중 오류가 발생했습니다.' });
      setSuccessMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>회원가입</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          {/* 닉네임 */}
          <label style={labelStyle}>닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => handleChange('nickname', e.target.value)}
            onBlur={checkDuplicateNickname}
            style={inputStyle}
            placeholder="닉네임을 입력하세요"
          />
          {isNicknameTaken && (
            <p style={errorStyle}>이미 사용 중인 닉네임입니다.</p>
          )}
          {errors.nickname && <p style={errorStyle}>{errors.nickname}</p>}

          {/* 이메일 */}
          <label style={labelStyle}>이메일</label>
          <input
            type="text"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={checkDuplicateEmail}
            style={inputStyle}
            placeholder="이메일을 입력하세요"
          />
          {isEmailTaken && (
            <p style={errorStyle}>이미 사용 중인 이메일입니다.</p>
          )}
          {errors.email && <p style={errorStyle}>{errors.email}</p>}

          {/* 아이디 */}
          <label style={labelStyle}>아이디</label>
          <input
            type="text"
            value={userid}
            onChange={(e) => handleChange('userid', e.target.value)}
            onBlur={checkDuplicateUserid}
            style={inputStyle}
            placeholder="아이디를 입력하세요"
          />
          {isUseridTaken && (
            <p style={errorStyle}>이미 사용 중인 아이디입니다.</p>
          )}
          {errors.userid && <p style={errorStyle}>{errors.userid}</p>}

          {/* 비밀번호 */}
          <label style={labelStyle}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            style={inputStyle}
            placeholder="비밀번호를 입력하세요"
          />
          {errors.password && <p style={errorStyle}>{errors.password}</p>}

          {/* 비밀번호 확인 */}
          <label style={labelStyle}>비밀번호 확인</label>
          <input
            type="password"
            value={passwordCheck}
            onChange={(e) => handleChange('passwordCheck', e.target.value)}
            style={inputStyle}
            placeholder="비밀번호를 다시 입력하세요"
          />
          {errors.passwordCheck && <p style={errorStyle}>{errors.passwordCheck}</p>}

          {/* 일반 에러/성공 */}
          {errors.general && <p style={errorStyle}>{errors.general}</p>}
          {successMsg && <p style={successStyle}>{successMsg}</p>}

          <button
            type="submit"
            style={buttonStyle}
            disabled={isSubmitting || isNicknameTaken || isEmailTaken || isUseridTaken}
          >
            {isSubmitting ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <div style={footerStyle}>
          <a href="/login">이미 계정이 있으신가요?</a>
        </div>
      </div>

      {/* 성공 팝업 */}
      {showPopup && (
        <div style={popupOverlayStyle}>
          <div style={popupBoxStyle}>
            <h2>🎉 회원가입이 완료되었습니다!</h2>
            <p>잠시 후 로그인 페이지로 이동합니다...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 팝업 스타일
const popupOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999
};

const popupBoxStyle = {
  backgroundColor: '#fff',
  padding: '2rem 3rem',
  borderRadius: '12px',
  textAlign: 'center',
  fontSize: '1.1rem',
  boxShadow: '0 0 20px rgba(0,0,0,0.3)'
};
