import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MyPageTabs from '@/components/MyPageTabs';
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import '@/styles/MyPage.css';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('report');
  const [userInfo, setUserInfo] = useState(null);
  const [lostPets, setLostPets] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get('/api/mypage/me');
        setUserInfo(userRes.data);

        const lostPetsRes = await axios.get('/api/mypage/lost-pets');
        setLostPets(lostPetsRes.data.content);

        const inquiriesRes = await axios.get('/api/mypage/inquiries');
        setInquiries(inquiriesRes.data.content);

        setIsLoading(false);
      } catch (err) {
        console.error("데이터를 가져오는 중 오류 발생:", err);
        setError("데이터 로딩에 실패했습니다.");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  
  const handleEditClick = () => {
    navigate('/mypage/edit'); 
  };

  return (
    <div style={{ backgroundColor: '#fff' }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <Banner text="마이페이지" />
      </div>

      <Breadcrumb />

      <div className="mypage-wrapper">
        <div className="left-profile">
          <div className="profile-summary">
            <h3>회원 정보</h3>
            <p>아이디: {userInfo.userid}</p>
            <p>닉네임: {userInfo.nickname}</p>
            <p>이메일: {userInfo.email}</p>
            <p>가입일: {userInfo.createdAt}</p>
            <p>작성한 분실신고: {lostPets.length} 건</p>
            <p>작성한 문의: {inquiries.length} 건</p>
            <button className="edit-button" onClick={handleEditClick}>수정하기</button>
          </div>
        </div>

        <div className="right-content">
          <div className="mypage-tabs">
            <div className="tab">
              <button
                onClick={() => setActiveTab('report')}
                className={activeTab === 'report' ? 'active' : ''}
              >
                내 분실신고
              </button>
              <button
                onClick={() => setActiveTab('inquiries')}
                className={activeTab === 'inquiries' ? 'active' : ''}
              >
                문의한 내용
              </button>
            </div>
          </div>

          <MyPageTabs 
            activeTab={activeTab} 
            lostPets={lostPets} 
            inquiries={inquiries} 
          />
        </div>
      </div>
    </div>
  );
}