import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { NoticeContext } from '@/contexts/NoticeContext';
import NoticeDeleteButton from '@/styles/NoticeDeleteButton';
import styles from '@/styles/pages/detail.module.css'; 

const rawBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const api = axios.create({
  baseURL: rawBase || undefined,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

export default function NoticeDetail() {
  const navigate = useNavigate();
  const { notice, setNotice } = useContext(NoticeContext);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const inFlightRef = useRef(false);

  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const toNum = (v) =>
    v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null;
  const idFromQuery = toNum(queryId);
  const idFromParam = toNum(paramId);
  const id = idFromQuery ?? idFromParam;
  const isValidId = Number.isFinite(id) && id > 0;

  const from = searchParams.get('from') || '1';

  useEffect(() => {
    if (!isValidId) {
      setErr(`잘못된 접근입니다. (paramId=${paramId ?? 'null'}, queryId=${queryId ?? 'null'})`);
      setLoading(false);
      return;
    }

    setNotice(null);
    setLoading(true);
    setErr('');

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    (async () => {
      try {
        const token = Cookies.get('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const url = `/api/notices/${id}`;
        console.debug('[NOTICE_DETAIL] GET', (rawBase || '(proxy)') + url);

        const { data } = await api.get(url, { headers });

        if (!data?.id) throw new Error('empty-detail');
        setNotice(data);
      } catch (e) {
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e.message;
        setErr(`공지사항을 찾을 수 없습니다. (id=${id}, status=${status ?? 'N/A'}, msg=${msg ?? 'N/A'})`);
        console.error('[NOTICE_DETAIL] error', e);
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    })();
  }, [isValidId, id, paramId, queryId, setNotice]);

  if (loading) return <div className={`${styles.detailContainer} ${styles.loadingBox}`}>로딩 중…</div>;
  if (err || !notice)
    return (
      <div className={`${styles.detailContainer} ${styles.errorBox}`}>
        {err || '공지사항을 찾을 수 없습니다.'}
      </div>
    );

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '-';

  const displayViews = Number.isFinite(notice?.views) ? notice.views : 0;

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detailInner}>
        <h2 className={styles.detailTitle}>{notice.title}</h2>

        <div className={styles.detailMeta}>
          작성자: {notice.author || '관리자'} | 날짜: {formatDate(notice.createdAt)} | 조회수: {displayViews}
        </div>

        <div className={styles.detailContent}>
          {notice.content}
        </div>

        {Array.isArray(notice.files) && notice.files.length > 0 && (
          <div className={styles.detailFiles}>
            <strong>첨부 파일:</strong>
            <ul className={styles.fileList}>
              {notice.files.map((file, idx) => (
                <li key={idx}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name ?? file.originalName ?? `파일 ${idx + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.detailButtons}>
          <NoticeDeleteButton noticeId={id} afterDelete={() => navigate('/notice')} />
          <button
            onClick={() => navigate(`/notice?page=${from}`)}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
}