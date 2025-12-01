import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Banner from '@/components/Mainpage/Banner';
import Cookies from 'js-cookie';
import axios from 'axios';
import { InquiryContext } from '@/contexts/InquiryContext';
import { LoginContext } from '@/contexts/LoginContext';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/write-forms.module.css'; // .module.css 파일 임포트

export default function InquiryEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const idParam = searchParams.get('id');
  const id = idParam ? parseInt(idParam, 10) : null;

  const token = Cookies.get('token');

  // 표기용 사용자
  const { user } = useContext(LoginContext);
  const currentUserName = user?.nickName ?? '익명 사용자';
  const { inquiry, setInquiry } = useContext(InquiryContext);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // 화면 토글은 서버의 isPublic과 반대
  const [isPrivate, setIsPrivate] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';
  const INQUIRY_BASE = `${API_BASE}/api/inquiries`;

  useEffect(() => {
    const fetchInquiry = async () => {
      if (!id) {
        setError('문의 ID가 없습니다.');
        setLoading(false);
        return;
      }
      try {
        if (inquiry?.id === id) {
          setTitle(inquiry.title ?? '');
          setContent(inquiry.content ?? '');
          setIsPrivate(inquiry.isPublic === false);
          setLoading(false);
          return;
        }

        const res = await axios.get(`${INQUIRY_BASE}/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = res.data?.data ?? res.data;
        setInquiry(data);
        setTitle(data?.title ?? '');
        setContent(data?.content ?? '');
        setIsPrivate(data?.isPublic === false);
      } catch (err) {
        console.error(err);
        setError('문의 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchInquiry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      const payload = { title, content, isPublic: !isPrivate };

      const res = await fetch(`${INQUIRY_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`서버 응답 오류: ${res.status} ${text}`);
      }

      alert('수정이 완료되었습니다.');
      navigate(`/inquiry/detail?id=${id}`);
    } catch (err) {
      console.error('문의 수정 실패:', err);
      alert('문의 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.writeContainer}>로딩 중...</div>;
  if (error)
    return (
      <div className={styles.writeContainer} style={{ color: 'red' }}>
        {error}
      </div>
    );
  if (!inquiry)
    return <div className={styles.writeContainer}>문의 정보를 찾을 수 없습니다.</div>;

  return (
    <div className={styles.writePage}>
      <Banner text="문의 수정" />

      <div className={styles.pagePadding}>
        <form onSubmit={handleSubmit} className={styles.writeForm}>
          <button type="button" onClick={() => navigate(-1)} className={styles.backBtn}>
            {'<'} 뒤로가기
          </button>

          <input
            type="text"
            className={styles.writeInput}
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />

          <input
            type="text"
            className={classNames(styles.writeInput, styles.inputDimmed)} // classnames 적용
            placeholder="작성자"
            value={currentUserName}
            readOnly
            title="로그인 정보로 자동 입력됩니다."
          />

          <textarea
            className={styles.writeTextarea}
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
          />

          {/* 비공개 체크 (서버 isPublic과 반대) */}
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <label htmlFor="private">비공개 문의</label>
          </div>

          <div className={styles.actionsRight}>
            <button
              type="submit"
              className={classNames(styles.writeBtn, styles.btnPrimary, {
                [styles.isLoading]: loading,
              })} // classnames 적용
              disabled={loading}
            >
              {loading ? '수정 중...' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}