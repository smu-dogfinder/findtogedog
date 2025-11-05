import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '@/styles/PreviewCards.css';

export default function LookupPreview() {
  const [recentDogs, setRecentDogs] = useState([]);

  useEffect(() => {
    axios
      .get(`/api/dog-details/paged`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      })
      .then((res) => {
        const data = res.data.data;
        if (!Array.isArray(data)) throw new Error('데이터 형식 오류: 배열이 아님');
        const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentDogs(sorted.slice(0, 3));
      })
      .catch((err) => console.error('유기견 데이터 불러오기 실패:', err));
  }, []);

  if (recentDogs.length === 0) {
    return (
      <div className="preview-card">
        <h3 className="preview-title">유기견 조회</h3>
        <p className="muted-text" style={{ marginTop: '1rem' }}>조회 가능한 유기견이 없습니다.</p>
        <div className="preview-footer">
          <Link to="/lookup" className="preview-more">전체 보기 →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-card">
      <h3 className="preview-title">유기견 조회</h3>
      <ul className="preview-list">
        {recentDogs.map((dog, index) => {
          const date = new Date(dog.createdAt);
          return (
            <li key={index} className="preview-list-item">
              📍 <strong>{dog.foundLocation || '위치 정보 없음'}</strong> / {dog.species || '품종 없음'} 
            </li>
          );
        })}
      </ul>
      <div className="preview-footer">
        <Link to="/lookup" className="preview-more">전체 보기 →</Link>
      </div>
    </div>
  );
}
