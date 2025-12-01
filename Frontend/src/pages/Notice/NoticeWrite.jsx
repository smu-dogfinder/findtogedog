import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import Cookies from 'js-cookie';
import { LoginContext } from '@/contexts/LoginContext';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/write-forms.module.css'; // .module.css 파일 임포트

export default function NoticeWrite() {
  const navigate = useNavigate();
  const { user } = useContext(LoginContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 로그인한 사용자의 닉네임을 작성자로 자동 설정
  const author = user?.nickName || user?.name || '';

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      alert('이미지 파일만 업로드 가능합니다.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    const c = content.trim();

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

    try {
      setSubmitting(true);
      await axios.post(`/api/notices`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      alert('공지사항이 등록되었습니다!');
      navigate('/notice');
    } catch (err) {
      console.error('공지사항 등록 실패:', err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 403 ? '공지사항 작성 권한이 없습니다.' : '공지사항 등록에 실패했습니다.');
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.writePage}>
      <div>
        <Banner text="공지사항 작성" />
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
            value={author}
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

          <div>
            <label className={styles.formLabel}>첨부파일 업로드</label>
            <div
              className={styles.dropzone}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('fileInput').click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="미리보기" />
              ) : (
                <p>파일을 드래그하거나 클릭해서 업로드하세요</p>
              )}
              <input
                type="file"
                accept="image/*"
                id="fileInput"
                className={styles.inputFileHidden}
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className={styles.actionsRight}>
            <button
              type="submit"
              className={classNames(styles.writeBtn, styles.btnPrimary, {
                [styles.isLoading]: submitting
              })}
              disabled={submitting}
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}