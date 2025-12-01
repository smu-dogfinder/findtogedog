import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '@/styles/AdminPage.css';

export default function UsersTab() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10); 
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  
  // 회원 목록 불러오기
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/admin/users/paged`, {
        params: { keyword, page, size },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setData(res.data);
    } catch (e) {
      console.error(e);
      setError('회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); 

  // 검색 실행 → 첫 페이지부터 다시 조회
  const onSearch = () => {
    if (page === 0) {
      load(); // 현재 페이지가 0이면 바로 로드
    } else {
      setPage(0); // 현재 페이지가 0이 아니면 페이지를 0으로 설정하여 useEffect가 로드를 트리거하도록 함
    }
  };

  // 회원 삭제
  const onDelete = async (id) => {
    if (!window.confirm('정말 이 회원을 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      load();
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container">
      <h2>회원 관리</h2>

      <form
        className="admin-filter-row"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="아이디/닉네임 검색"
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
      {!loading && !error && data.content.length === 0 && <p>회원이 없습니다.</p>}

      {!loading && !error && data.content.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>UserID</th>
                <th>닉네임</th>
                <th>가입일</th>
                <th>문의글</th>
                <th>신고글</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/adminpage/users/${u.id}`}>{u.userid}</Link>
                  </td>
                  <td>{u.nickname}</td>
                  <td>{new Date(u.createdAt).toLocaleString()}</td>
                  <td>{u.inquiryCount ?? '-'}</td>
                  <td>{u.lostReportCount ?? '-'}</td>
                  <td>
                    <button 
                      onClick={() => onDelete(u.id)}
                      className="custom-btn btn-4"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {data.totalPages > 1 && (
            <div style={{ marginTop: 8 }}>
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                이전
              </button>
              <span style={{ margin: '0 8px' }}>
                {data.number + 1} / {data.totalPages}
              </span>
              <button
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}