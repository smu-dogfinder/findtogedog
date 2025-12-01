import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@/styles/PreviewCards.css';

export default function ReportPreview() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get('/api/lost-pet/paged', {
          params: { page: 0, limit: 100 },
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });

        const list = Array.isArray(res.data?.data) ? res.data.data : [];

        const sorted = [...list].sort((a, b) => {
          const aTime = new Date(a.createdAt || a.dateLost || 0).getTime();
          const bTime = new Date(b.createdAt || b.dateLost || 0).getTime();
          return bTime - aTime; // desc
        });

        setReports(sorted.slice(0, 3));
      } catch (e) {
        console.error('유기견 신고 데이터 로딩 실패:', e);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="preview-card">
        <h3 className="preview-title">유기견 신고 목록</h3>
        <p className="loading-text" style={{ marginTop: '1rem' }}>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="preview-card">
        <h3 className="preview-title">유기견 신고 목록</h3>
        <p className="muted-text" style={{ marginTop: '1rem' }}>최근 신고된 유기견이 없습니다.</p>
        <div className="preview-footer">
          <Link to="/report" className="preview-more">전체 보기 →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-card">
      <h3 className="preview-title">유기견 신고 목록</h3>
      <div className="preview-content">
        <ul className="preview-list">
          {reports.map((r) => {
            const title = r.title || `${r.species || '품종 불명'} 신고`;
            const date = r.dateLost || r.createdAt;
            const formattedDate = date
              ? new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
              : '날짜 정보 없음';
            const place = r.placeLost || r.region || '장소 정보 없음';
            const truncated = title.length > 22 ? `${title.slice(0, 22)}…` : title;

            return (
              <li key={r.id} className="preview-list-item">
                <Link to={`/report/view?id=${r.id}`} className="preview-link">
                  <span className="preview-dot">•</span>{' '}
                  <strong>{truncated}</strong>{' '}
                  <span className="preview-meta">/ {place} / {formattedDate}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="preview-footer">
          <Link to="/report" className="preview-more">전체 보기 →</Link>
        </div>
      </div>
    </div>
  );
}
