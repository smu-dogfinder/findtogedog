import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '@/styles/AdminPage.css';

export default function InquiriesTab() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('ALL'); 
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const computeAnswered = (raw) => {
    const answered =
      (typeof raw.answered === 'boolean' && raw.answered) ||
      (typeof raw.hasReply === 'boolean' && raw.hasReply) ||
      (typeof raw.replyCount === 'number' && raw.replyCount > 0);
    return Boolean(answered);
  };

  const normalizeItem = (raw) => {
    const createdAt = raw.createdAt ?? raw.created_at ?? raw.created_time ?? null;
    const title = raw.title ?? raw.titleForList ?? '(제목 없음)';
    const authorNickname = raw.authorNickname ?? raw.nickname ?? raw.author ?? raw.userid ?? '작성자';

    const answered = computeAnswered(raw);
    const normStatus = answered ? 'ANSWERED' : 'PENDING';

    return {
      id: raw.id,
      displayNo: raw.displayNo,
      title,
      authorNickname,
      createdAt,
      status: normStatus,           
      answered,                     
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/inquiries/paged', {
        params: { status: status === 'ALL' ? undefined : status, q },
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });

      const rawList = res.data?.content || res.data?.data || res.data || [];
      const list = (Array.isArray(rawList) ? rawList : []).map(normalizeItem);

      const filtered =
        status === 'ALL' ? list : list.filter((it) => it.status === status);

      const finalList = q
        ? filtered.filter((it) => {
            const s = (q || '').toLowerCase();
            return (
              String(it.title).toLowerCase().includes(s) ||
              String(it.authorNickname).toLowerCase().includes(s)
            );
          })
        : filtered;

      setItems(finalList);
    } catch (e) {
      console.error(e);
      setError('문의 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const labelStatus = (s) =>
    ({ PENDING: '대기', ANSWERED: '답변완료' }[s] || s || '-');

  const formatDate = (dt) => {
    if (!dt) return '-';
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return String(dt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  return (
    <section>
      <h3>문의 관리</h3>
      <form
        className="admin-filter-row"
        onSubmit={(e) => {
          e.preventDefault();
          fetchData();
        }}
      >
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">전체</option>
          <option value="PENDING">대기</option>
          <option value="ANSWERED">답변완료</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목/작성자 검색"
        />
        <button 
          type="submit"
          className="admin-btn admin-btn-primary"
        >
          검색
        </button>
      </form>

      {loading && <p>불러오는 중...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && items.length === 0 && <p>문의가 없습니다.</p>}

      {!loading && !error && items.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>제목</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>상태</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.displayNo}</td>
                <td>{it.title}</td>
                <td>{it.authorNickname}</td>
                <td>{formatDate(it.createdAt)}</td>
                <td
                  style={{
                    color: it.status === 'PENDING' ? '#c82333' : '#218838'
                  }}
                >
                  {labelStatus(it.status)}
                </td>
                <td className="table-actions">
                  {it.status === 'PENDING' ? (
                    <Link to={`/inquiry/detail?id=${it.id}`}>
                      <button
                        className = "custom-btn btn-4"
                      >
                        답변하기
                      </button>
                    </Link>
                  ) : (
                    <Link to={`/inquiry/detail?id=${it.id}`}>
                      <button
                        className = "custom-btn btn-3"
                      >
                        답변보기
                      </button>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
