import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '@/styles/PreviewCards.css';

export default function NoticePreview() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await axios.get(`/api/notices/paged`, {
          params: { page: 0, size: 3, sort: 'createdAt,desc' },
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.content)
          ? res.data.content
          : [];
        setNotices(list);
      } catch (e) {
        console.error('공지사항 데이터 로딩 실패:', e);
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) {
    return (
      <div className="preview-card">
        <h3 className="preview-title">공지사항</h3>
        <p className="loading-text" style={{ marginTop: '1rem' }}>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const previewList = notices.slice(0, 3);
  if (previewList.length === 0) {
    return (
      <div className="preview-card">
        <h3 className="preview-title">공지사항</h3>
        <p className="muted-text">공지사항이 없습니다.</p>
        <div className="preview-footer">
          <Link to="/notice" className="preview-more">전체 보기 →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-card">
      <h3 className="preview-title">공지사항</h3>
      <div className="preview-content">
        <ul className="preview-list">
          {previewList.map((notice) => (
            <li key={notice.id} className="preview-list-item">
              <Link to={`/notice/detail?id=${notice.id}`} className="preview-link">
                {notice.title.length > 20 ? `${notice.title.slice(0, 20)}...` : notice.title}
              </Link>
            </li>
          ))}
        </ul>
        <div className="preview-footer">
          <Link to="/notice" className="preview-more">전체 보기 →</Link>
        </div>
      </div>
    </div>
  );
}
