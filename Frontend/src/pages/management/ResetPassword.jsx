import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  containerStyle,
  boxStyle,
  titleStyle,
  formStyle,
  labelStyle,
  inputStyle,
  buttonStyle,
} from '../../styles/AuthFormStyles';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // 이메일 링크에 포함된 토큰

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setError('');
    setSuccess(true);

    // TODO: 백엔드 연동 시 아래 코드 추가
    // axios.post('/api/reset-password', { token, newPassword: password })
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>비밀번호 재설정</h2>

        {success ? (
          <p style={{ color: 'green' }}>
            비밀번호가 성공적으로 변경되었습니다! 로그인해주세요.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={formStyle}>
            <label style={labelStyle}>새 비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호 입력"
              style={inputStyle}
            />

            <label style={labelStyle}>새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 다시 입력"
              style={inputStyle}
            />

            {error && (
              <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
            )}

            <button type="submit" style={buttonStyle}>
              비밀번호 변경
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
