// src/pages/MyPageEdit.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@/styles/MyPage.css';

export default function MyPageEdit() {
  const [userInfo, setUserInfo] = useState({
    userid: '',
    nickname: '',
    email: '',
  });
  const [newNickname, setNewNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get('/api/mypage/me');
        setUserInfo(res.data);
        setNewNickname(res.data.nickname);
        setIsLoading(false);
      } catch (err) {
        console.error("회원 정보를 가져오는 중 오류 발생:", err);
        setError("회원 정보를 불러오는 데 실패했습니다.");
        setIsLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData = {
        nickname: newNickname,
      };

      await axios.put('/api/mypage/update-nickname', updateData);
      
      setSuccessMessage("닉네임이 성공적으로 수정되었습니다.");
      
      setUserInfo(prevInfo => ({
        ...prevInfo,
        nickname: newNickname,
      }));
    } catch (err) {
      console.error("닉네임 수정 중 오류 발생:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("닉네임 수정에 실패했습니다. 다시 시도해 주세요.");
      }
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    
    // 새 비밀번호가 비어있으면 수정하지 않음
    if (!newPassword) {
        setError("새 비밀번호를 입력해주세요.");
        return;
    }

    try {
      const updateData = {
        currentPassword: currentPassword,
        newPassword: newPassword,
      };

      await axios.put('/api/mypage/update-password', updateData);
      
      setSuccessMessage("비밀번호가 성공적으로 변경되었습니다.");
      
      // 입력 필드 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      console.error("비밀번호 수정 중 오류 발생:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("비밀번호 수정에 실패했습니다. 다시 시도해 주세요.");
      }
    }
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div style={{ backgroundColor: '#fff' }}>
      <div className="mypage-edit-wrapper">
        <form onSubmit={handleSubmit} className="edit-form">
          <h2>회원 정보 수정</h2>
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <div className="form-group">
            <label>닉네임</label>
            <input
              type="text"
              name="nickname"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>아이디</label>
            <input
              type="text"
              name="userid"
              value={userInfo.userid}
              disabled
            />
          </div>
          
          <div className="form-group">
            <label>비밀번호</label>
            <div className="password-display">
                <input
                    type="password"
                    value="********"
                    disabled
                />
                <button 
                    type="button" 
                    className="edit-button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                    {showPasswordForm ? '취소' : '수정'}
                </button>
            </div>
          </div>
          
          {showPasswordForm && (
            <div className="password-change-form">
                <div className="form-group">
                    <label>현재 비밀번호</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>새 비밀번호</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>새 비밀번호 확인</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="button" onClick={handlePasswordUpdate} className="edit-button">비밀번호 변경</button>
            </div>
          )}

          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              name="email"
              value={userInfo.email}
              disabled
            />
          </div>

          <button type="submit" className="submit-button">변경사항 저장</button>
        </form>
      </div>
    </div>
  );
}