import React, { useState, useEffect, useRef } from 'react'; // ★ useRef 추가
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
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
  
  // 경고창 중복 실행 방지용 ref
  const alertShown = useRef(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get('token'); 

    // 1. 토큰이 없을 때 처리
    if (!token) {
      // 이미 경고창을 띄웠다면 여기서 함수 종료
      if (alertShown.current) {
        return; 
      }

      // 경고창을 아직 안 띄웠다면 표시하고 플래그를 true로 변경
      alertShown.current = true; 
      alert("로그인이 필요한 서비스입니다.");
      navigate('/login'); 
      return; 
    }

    // 2. 토큰이 있을 때 데이터 요청
    const fetchData = async () => {
      try {
        const [userRes, lostPetsRes, inquiriesRes] = await Promise.all([
          axios.get('/api/mypage/me'),
          axios.get('/api/mypage/lost-pets'),
          axios.get('/api/mypage/inquiries')
        ]);

        setUserInfo(userRes.data);
        setLostPets(lostPetsRes.data.content);
        setInquiries(inquiriesRes.data.content);

        setIsLoading(false);

      } catch (err) {
        console.error("데이터 로딩 실패:", err);

        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            if (alertShown.current) return; // 중복 방지 추가
            
            alertShown.current = true;
            alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
            navigate('/login');
            return;
        }

        setError("데이터를 불러오지 못했습니다.");
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  // 렌더링 방어 코드
  const token = Cookies.get('token');
  if (!token) return null;

  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>로딩 중...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>{error}</div>;
  }

  if (!userInfo) return null;

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
            <p>가입일: {userInfo.createdAt ? String(userInfo.createdAt).substring(0, 10) : '-'}</p>
            <p>작성한 분실신고: {lostPets?.length || 0} 건</p>
            <p>작성한 문의: {inquiries?.length || 0} 건</p>
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