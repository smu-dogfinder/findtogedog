import React, { useState } from 'react';

import {
  containerStyle,
  boxStyle,
  titleStyle,
  formStyle,
  labelStyle,
  inputStyle,
  buttonStyle,
  errorStyle,
} from '../../styles/AuthFormStyles';

export default function FindPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setErrorMsg('유효한 이메일 주소를 입력하세요.');
      return;
    }
    setErrorMsg('');
    setSubmitted(true);

    // ✅ 실제로는 여기서 서버로 비밀번호 재설정 요청을 보냅니다.
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>비밀번호 찾기</h2>
        {!submitted ? (
          <form onSubmit={handleSubmit} style={formStyle}>
            <label htmlFor="email" style={labelStyle}>비밀번호를 찾고자하는 이메일 주소를 입력해주세요.</label>
            <input
              type="text"
              required
              value={email}
              placeholder="이메일 주소"
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            {errorMsg && <p style={errorStyle}>{errorMsg}</p>}
            <button
              type="submit" style={buttonStyle}
            >
              비밀번호 초기화 메일 보내기
            </button>
          </form>
        ) : (
          <p style={{ color: 'green' }}>
            비밀번호 재설정 링크가 <strong>{email}</strong>로 전송되었습니다.
          </p>
        )}
      </div>
    </div>
  );
}
