import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import { LoginContext } from '@/contexts/LoginContext';
import Cookies from 'js-cookie';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/write-forms.module.css'; // .module.css 파일 임포트

export default function InquiryWrite() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const token = Cookies.get('token');
  const { user } = useContext(LoginContext);
  const currentUserName = user?.nickName ?? '익명 사용자';

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
      const res = await fetch(`/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, isPublic }),
      });

      if (!res.ok) throw new Error('서버 응답 오류');

      alert('문의가 등록되었습니다.');
      navigate('/inquiry');
    } catch (err) {
      console.error('문의 등록 실패:', err);
      alert('문의 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.writePage}>
      <div>
        <Banner text="문의사항 작성" />
        <Breadcrumb />
      </div>

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
            className={classNames(styles.writeInput, styles.inputDimmed)}
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

          {/* 비공개 */}
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="public"
              checked={!isPublic}
              onChange={(e) => setIsPublic(!e.target.checked)}
            />
            <label htmlFor="public">비공개 문의</label>
          </div>

          {/* 버튼 */}
          <div className={styles.actionsRight}>
            <button
              type="submit"
              className={classNames(styles.writeBtn, styles.btnPrimary, {
                [styles.isLoading]: loading,
              })}
              disabled={loading}
            >
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}