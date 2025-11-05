import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { LoginContext } from '@/contexts/LoginContext';
import '@/styles/AdminPage.css';

export default function NoticesTab() {
  const { user } = useContext(LoginContext);
  const isAdmin = !!(user?.role && String(user.role).toUpperCase().includes('ADMIN'));
  const author = user?.nickName || user?.name || ''; 
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ id: null, title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const apiBase = () => {
    const base = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_API_URL || '') : '';
    const origin = base.trim() ? base.trim().replace(/\/+$/, '') : '';
    return origin || '';
  };
  const listUrl = () => `${apiBase()}/api/notices/paged`;   
  const crudUrl = () => `${apiBase()}/api/notices`;         

  const authHeaders = () => {
    const token = Cookies.get('token');
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'ngrok-skip-browser-warning': 'true',
    };
  };

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(listUrl(), {
        headers: { 'ngrok-skip-browser-warning': 'true', 'Cache-Control': 'no-store' },
      });
      const body = res.data;
      const rows = Array.isArray(body?.data) ? body.data
                 : Array.isArray(body?.content) ? body.content
                 : Array.isArray(body) ? body
                 : [];
      setList(rows);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e.message || '공지 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const resetForm = () => setForm({ id: null, title: '', content: '' });

  const submit = async (e) => {
    e.preventDefault();
    const t = form.title.trim();
    const c = form.content.trim();
    if (!t || !c) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const token = Cookies.get('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    const payload = { title: t, content: c, author: author || '익명' };

    setSaving(true);
    try {
      if (form.id) {
        await axios.put(`${crudUrl()}/${form.id}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(crudUrl(), payload, { headers: authHeaders() });
      }
      resetForm();
      await fetchNotices();
      alert('저장되었습니다.');
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 403 ? '공지사항 작성/수정 권한이 없습니다.' : '저장 실패');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const edit = (it) => setForm({
    id: it.id,
    displayNo: it.displayNo,
    title: it.title ?? '',
    content: it.content ?? '',
  });

  const remove = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;

    const token = Cookies.get('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await axios.delete(`${crudUrl()}/${id}`, { headers: authHeaders() });
      if (res.status === 204 || res.status === 200) {
        await fetchNotices();
        alert('삭제되었습니다.');
      } else {
        await fetchNotices();
        alert('삭제 처리되었습니다.');
      }
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 403 ? '공지사항 삭제 권한이 없습니다.' : '삭제 실패');
      alert(msg);
    }
  };

  return (
    <section>
      <h3>공지</h3>

      {loading && <p>불러오는 중...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <form onSubmit={submit} className="admin-form" style={{ gap: 8 }}>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="공지 제목"
          maxLength={200}
          required
        />

        <input
          type="text"
          className="input input--dimmed"
          placeholder="작성자"
          value={author}
          readOnly
          title="로그인 정보로 자동 입력됩니다."
        />

        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="공지 내용"
          rows={6}
          required
        />

        <div className="admin-form-actions">
          <button type="submit" disabled={saving}>
            {form.id ? (saving ? '수정 중...' : '공지 수정') : (saving ? '등록 중...' : '공지 등록')}
          </button>
          {form.id && (
            <button type="button" onClick={resetForm} disabled={saving}>
              취소
            </button>
          )}
        </div>
      </form>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {list.map((it) => (
            <tr key={it.id}>
              <td>{it.displayNo}</td>
              <td>{it.title}</td>
              <td>{it.author || '-'}</td>
              <td>{formatDate(it.createdAt)}</td>
              <td className="button-group">
                <button 
                  onClick={() => edit(it)}
                  className="custom-btn btn-3"
                >
                  수정
                </button>
                <button 
                  onClick={() => remove(it.id)}
                  className="custom-btn btn-4"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && !loading && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                등록된 공지가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function formatDate(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
