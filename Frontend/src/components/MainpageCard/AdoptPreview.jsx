import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '@/styles/PreviewCards.css';

export default function AdoptPreview() {
  const [adoptDogs, setAdoptDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdoptDogs = async () => {
      try {
        const res = await axios.get(`/api/dog-details/paged`, {
          params: { page: 0, size: 1000 },
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        const sortedData = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const adoptableDogs = sortedData.filter(dog => (dog.state || '').includes('보호중')).slice(0, 3);
        setAdoptDogs(adoptableDogs);
      } catch (e) {
        console.error('입양 가능한 동물 데이터 로딩 실패:', e);
        setAdoptDogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAdoptDogs();
  }, []);

  if (loading) {
    return (
      <div className="preview-card">
        <h3 className="preview-title">입양 가능한 동물</h3>
        <p className="loading-text" style={{ marginTop: '1rem' }}>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (adoptDogs.length === 0) {
    return (
      <div className="preview-card">
        <h3 className="preview-title">입양 가능한 동물</h3>
        <p className="muted-text" style={{ marginTop: '1rem' }}>입양 가능한 동물이 없습니다.</p>
        <div className="preview-footer">
          <Link to="/adopt" className="preview-more">전체 보기 →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-card">
      <h3 className="preview-title">입양 가능한 동물</h3>
      <div className="preview-content">
        <div className="preview-dog-list">
          {adoptDogs.map((dog) => (
            <div key={dog.id} className="preview-dog-card">
              <img src={dog.imagePath || '/default-dog.jpg'} alt={dog.species} className="preview-img" />
              <p style={{ margin: '0.5rem 0 0.2rem', fontWeight: 'bold' }}>{dog.species}</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{dog.gender}</p>
            </div>
          ))}
        </div>
        <div className="preview-footer">
          <Link to="/adopt" className="preview-more">전체 보기 →</Link>
        </div>
      </div>
    </div>
  );
}
