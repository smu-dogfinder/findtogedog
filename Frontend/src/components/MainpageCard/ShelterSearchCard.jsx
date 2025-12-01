// src/components/Mainpage/ShelterSearchCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/PreviewCards.css';

export default function ShelterSearchCard() {
  const navigate = useNavigate();

  return (
    <div className="preview-card">
      <h3 className="preview-title">보호소 찾기</h3>
      <p style={{ fontSize: '0.95rem', color: '#333', marginBottom: '1rem' }}>
        위치 기반으로 가까운 보호소를 찾아보세요.<br />
        지역, 키워드로도 검색할 수 있습니다.
      </p>
      <button onClick={() => navigate('/shelters')} className="preview-solid-btn">
        보호소 검색하기
      </button>
    </div>
  );
}
