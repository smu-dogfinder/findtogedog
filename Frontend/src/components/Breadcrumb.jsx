import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginContext } from '@/contexts/LoginContext';

export default function BreadcrumbNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(LoginContext);
  const isAdmin = !!(user?.role && String(user.role).toUpperCase().includes('ADMIN'));

  // 관리자 여부에 따라 경로 동적 구성
  const structure = useMemo(() => ({
    '유기견 조회': {
      '전체 보기': '/lookup',
      '강아지의 성견 모습 예측': '/lookup/predict-dog',
    },
    '유기견 신고': {
      '전체 보기': '/report',
      '반려동물 분실 신고': '/report/write',
      '유기견 신고 방법 안내': '/report/how',
    },
    '유기견 입양': {
      '전체 보기': '/adopt',
      '입양 절차 안내': '/adopt/process',
    },
    '보호소 찾기': {
      '보호소 찾기': '/shelters',
    },
    '공지 및 문의': {
      '공지사항': '/notice',
      ...(isAdmin ? { '공지 작성하기': '/notice/write' } : {}),
      '문의사항':'/inquiry',
      '문의 작성하기': '/inquiry/write',
    },
    '마이페이지': {
      '마이페이지': isAdmin ? '/adminpage' : '/mypage',
    },
  }), [isAdmin]);

  const [selectedMain, setSelectedMain] = useState('유기견 조회');
  const [selectedSub, setSelectedSub] = useState('');
  const [hoverMain, setHoverMain] = useState(false);
  const [hoverSub, setHoverSub] = useState(false);

  // 현재 경로에 따라 초기 선택값 설정
  useEffect(() => {
    const path = location.pathname;
    for (const [main, subs] of Object.entries(structure)) {
      for (const [sub, route] of Object.entries(subs)) {
        if (route === path) {
          setSelectedMain(main);
          setSelectedSub(sub);
          return;
        }
      }
    }
  }, [location.pathname, structure]);

  const handleMainSelect = (main) => {
    setSelectedMain(main);
    const keys = Object.keys(structure[main]);
    const firstSub = keys[0];
    setSelectedSub(firstSub);
    if (keys.length === 1) {
      navigate(structure[main][firstSub]);
    }
  };

  const handleSubSelect = (sub) => {
    setSelectedSub(sub);
    const path = structure[selectedMain][sub];
    if (path) navigate(path);
  };

  const hasSubMenu = Object.keys(structure[selectedMain] || {}).length > 1;

  return (
    <div style={styles.container}>
      <span style={styles.homeIcon} onClick={() => navigate('/')}>
        <img
          src="/imageupload/homeicon.png"
          alt="홈 아이콘"
          style={{ width: '18px', height: '18px', marginTop: '0.4rem' }}
        />
      </span>

      <span style={styles.separator}></span>

      {/* 메인 드롭다운 */}
      <div
        style={styles.dropdownWrapper}
        onMouseEnter={() => setHoverMain(true)}
        onMouseLeave={() => setHoverMain(false)}
      >
        <div style={styles.dropdownLabel}>
          {selectedMain} ▼
        </div>
        {hoverMain && (
          <ul style={styles.menuList}>
            {Object.keys(structure).map((main) => (
              <li
                key={main}
                style={styles.menuItem}
                onClick={() => handleMainSelect(main)}
              >
                {main}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 서브 드롭다운 (항목이 여러 개일 때만) */}
      {hasSubMenu && (
        <>
          <span style={styles.separator}></span>
          <div
            style={styles.dropdownWrapper}
            onMouseEnter={() => setHoverSub(true)}
            onMouseLeave={() => setHoverSub(false)}
          >
            <div style={styles.dropdownLabel}>
              {selectedSub || '하위 선택'} ▼
            </div>
            {hoverSub && (
              <ul style={styles.menuList}>
                {Object.keys(structure[selectedMain]).map((sub) => (
                  <li
                    key={sub}
                    style={styles.menuItem}
                    onClick={() => handleSubSelect(sub)}
                  >
                    {sub}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', alignItems: 'center', gap: '1px', padding: '6px 20px', backgroundColor: '#fff', borderBottom: '1px solid #ccc' },
  homeIcon: { fontSize: '1.1rem', padding: '8px 12px', cursor: 'pointer' },
  separator: { width: '1px', height: '24px', backgroundColor: '#ccc', margin: '0 12px' },
  dropdownWrapper: { position: 'relative', cursor: 'pointer' },
  dropdownLabel: { padding: '10px 16px', border: '1px solid #fff', backgroundColor: '#fff', fontSize: '0.95rem', fontWeight: 500, whiteSpace: 'nowrap' },
  menuList: { position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #ccc', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 100, listStyle: 'none', margin: 0, padding: 0, minWidth: '180px' },
  menuItem: { padding: '10px 16px', fontSize: '0.9rem', whiteSpace: 'nowrap', transition: 'background 0.2s', cursor: 'pointer' },
};
