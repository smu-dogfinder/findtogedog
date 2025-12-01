import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import '@/styles/AdminPage.css';

// 분리된 컴포넌트
import AdminTabBar from '@/components/admin/AdminTabBar';
import InquiriesTab from '@/components/admin/tabs/InquiriesTab';
import UsersTab from '@/components/admin/tabs/UsersTab';
import ReportsTab from '@/components/admin/tabs/ReportsTab';
import NoticesTab from '@/components/admin/tabs/NoticesTab';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // 필요시 /api/admin/me 로 교체
        const me = await axios.get('/api/mypage/me');
        setAdminInfo(me.data);
      } catch (e) {
        console.error(e);
        setError('관리자 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="adminpage-root">
      <div className="adminpage-banner">
        <Banner text="관리자 페이지" />
      </div>

      <Breadcrumb />

      <div className="mypage-wrapper">
        {/* 좌측: 관리자 요약 */}
        <div className="left-profile">
          <div className="profile-summary">
            <h3>관리자 계정</h3>
            <p>아이디: {adminInfo?.userid}</p>
            <p>이름/닉네임: {adminInfo?.nickname || adminInfo?.name}</p>
            <p>이메일: {adminInfo?.email}</p>
            <p>권한: {adminInfo?.role || 'ADMIN'}</p>
            <p>가입일: {formatDate(adminInfo?.createdAt)}</p>
          </div>
        </div>

        {/* 우측: 탭 & 콘텐츠 */}
        <div className="right-content">
          <AdminTabBar
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { key: 'users', label: '회원 관리' },
              { key: 'reports', label: '신고 관리' },
              { key: 'inquiries', label: '문의 관리' },
              { key: 'notices', label: '공지 관리' },
            ]}
          />

          <div className="tab-content" style={{ marginTop: 16 }}>
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'inquiries' && <InquiriesTab />}
            {activeTab === 'notices' && <NoticesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '-';
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return String(dt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return String(dt);
  }
}
