import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Banner from '@/components/MainPage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import Cookies from 'js-cookie';
import axios from 'axios';
import { LoginContext } from '@/contexts/LoginContext';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/pages.module.css'; // .module.css 파일 임포트

export default function InquiryMain() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(LoginContext);

  const queryPage = Number(searchParams.get('page')) || 1;
  const queryLimit = Number(searchParams.get('limit')) || 5;

  const [inquiries, setInquiries] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = Cookies.get('token');

  const meNickname =
    user?.nickName ??
    (() => {
      try {
        const raw = Cookies.get('user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u?.nickName || u?.nickname || u?.name || null;
      } catch {
        return null;
      }
    })();

  const meUserid = user?.userid ?? user?.id ?? null;
  const isAdmin = !!(user?.role && String(user.role).toUpperCase().includes('ADMIN'));

  const PRIVATE_MSG = '비공개 글입니다. 작성자만 열람할 수 있습니다.';

  const canView = (item) => {
    if (isAdmin) return true;
    if (item.isPublic) return true;

    const authorUserid = item.authorUserid ?? item.userId ?? item.userid ?? null;
    if (authorUserid && meUserid) {
      return authorUserid === meUserid;
    }
    return item.authorNickname === meNickname;
  };

  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) 목록 불러오기
        const res = await axios.get('/api/inquiries/paged', {
          params: { page: queryPage, limit: queryLimit },
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });

        const result = res.data || {};
        const baseList = Array.isArray(result.data)
          ? result.data.map((raw) => {
              const isPublic =
                typeof raw.is_public !== 'undefined'
                  ? Boolean(raw.is_public)
                  : typeof raw.isPublic !== 'undefined'
                  ? Boolean(raw.isPublic)
                  : !raw.isPrivate;

              return {
                id: raw.id,
                title: raw.titleForList ?? raw.title ?? '(제목 없음)',
                content: raw.content,
                authorNickname: raw.authorNickname ?? raw.nickname ?? raw.author ?? '글쓴이',
                authorUserid: raw.authorUserid ?? raw.userId ?? raw.userid ?? null,
                createdAt: raw.createdAt ?? raw.created_at ?? raw.createdAT ?? null,
                isPublic,
                hasReply: Boolean(raw.answered),
                displayNo: raw.displayNo ?? raw.display_no ?? null,
              };
            })
          : [];

        setTotalPages(result?.pagination?.meta?.totalPages ?? 1);
        setTotalItems(result?.pagination?.meta?.totalItems ?? baseList.length);

        setInquiries(baseList);
      } catch (err) {
        setError('문의 목록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
    // user, token 바뀌면 권한이 달라질 수 있으니 의존성에 포함
  }, [queryPage, queryLimit, user, token]);

  const handlePageChange = (page) => {
    setSearchParams({ page: String(page), limit: String(queryLimit) });
  };

  return (
    <div>
      <div className={styles.bannerWrap}>
        <Banner text="문의사항" />
      </div>
      <Breadcrumb />

      <div className={styles.boardContainer}>
        <div className={styles.boardHeader}>
          <div>
            전체 <strong className={styles.countBadge}>{totalItems}</strong> 건
          </div>
          <button className={classNames(styles.btn, styles.btnPrimary)} onClick={() => navigate('/inquiry/write')}>
            문의 작성하기
          </button>
        </div>

        {loading ? (
          <div className={styles.helperText} style={{ textAlign: 'center', padding: '2rem' }}>
            로딩 중...
          </div>
        ) : error ? (
          <div className={styles.muted} style={{ textAlign: 'center', padding: '2rem' }}>
            {error}
          </div>
        ) : (
          <table className={styles.boardTable}>
            <thead>
              <tr>
                <th>번호</th>
                <th style={{ textAlign: 'left' }}>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>답변 여부</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => {
                const allowed = canView(inq);
                return (
                  <tr
                    key={inq.id}
                    onClick={(e) => {
                      if (!allowed) {
                        e.preventDefault();
                        alert(PRIVATE_MSG);
                        return;
                      }
                      navigate(`/inquiry/detail?id=${inq.id}&from=${queryPage}`);
                    }}
                    style={{ cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed ? 1 : 0.6 }}
                  >
                    <td>{inq.displayNo}</td>
                    <td style={{ textAlign: 'left' }}>
                      {inq.isPublic ? inq.title : `[비공개] ${inq.title}`}
                    </td>
                    <td>
                      {inq.authorNickname
                        ? inq.authorNickname.slice(0, 2) + '*'.repeat(Math.max(inq.authorNickname.length - 2, 0))
                        : '글쓴이'}
                    </td>
                    <td>{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : '-'}</td>
                    <td>{inq.hasReply ? '답변완료' : '미답변'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={classNames(styles.pageBtn, {
                [styles.pageBtnActive]: queryPage === i + 1,
              })}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}