import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import Banner from "@/components/Mainpage/Banner";
import Breadcrumb from "@/components/Breadcrumb";
import axios from "axios";
import { LoginContext } from '@/contexts/LoginContext';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/pages.module.css'; // .module.css 파일 임포트

export default function NoticeMain() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryPage = Number(searchParams.get("page")) || 1;    // 1-base UI
  const queryLimit = Number(searchParams.get("limit")) || 5;
  const queryOrder = searchParams.get("order") || "asc";
  const querySearchType = searchParams.get("type") || "title";
  const querySearchText = searchParams.get("text") || "";

  const [notices, setNotices] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, currentPage: 1, totalItems: 0 });
  const [searchType, setSearchType] = useState(querySearchType);
  const [searchText, setSearchText] = useState(querySearchText);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useContext(LoginContext);
  const isAdmin = !!(user?.role && String(user.role).toUpperCase().includes('ADMIN'));

  // page/limit 기본값 보정
  useEffect(() => {
    const hasPage = searchParams.has("page");
    const hasLimit = searchParams.has("limit");
    if (!hasPage || !hasLimit) {
      setSearchParams({
        page: hasPage ? searchParams.get("page") : "1",
        limit: hasLimit ? searchParams.get("limit") : "5",
        order: queryOrder,
        type: searchType,
        text: searchText,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 내비게이션 변화/검색 파라미터 변화 시 재요청
  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, queryPage, queryLimit, queryOrder, querySearchType, querySearchText]);

  // 탭 비활성/활성 전환 시 최신화
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchNotices();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 안전한 URL 생성
  const buildUrl = () => {
    const base =
      typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL || "" : "";
    const origin = base.trim() ? base.trim().replace(/\/+$/, "") : "";
    return `${origin}/api/notices/paged`;
  };

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl();

      const params = {
        page: Math.max(0, queryPage - 1), // 0-base
        size: queryLimit,
        limit: queryLimit, // 호환
        sort: `createdAt,${queryOrder}`,
        order: queryOrder,
        type: querySearchType,
        q: querySearchText || undefined,
      };

      const res = await axios.get(url, {
        params,
        headers: { "ngrok-skip-browser-warning": "true", "Cache-Control": "no-store" },
      });

      const body = res.data;
      const list = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.content)
        ? body.content
        : [];

      const nextMeta =
        body?.pagination?.meta ?? {
          totalPages: Number.isFinite(body?.totalPages) ? body.totalPages : 1,
          totalItems: Number.isFinite(body?.totalElements) ? body.totalElements : list.length,
          currentPage: Number.isFinite(body?.number) ? body.number + 1 : queryPage,
        };

      setNotices(list);
      setMeta(nextMeta);

      if (nextMeta.totalPages > 0 && queryPage > nextMeta.totalPages) {
        setSearchParams({
          page: String(nextMeta.totalPages),
          limit: String(queryLimit),
          order: queryOrder,
          type: searchType,
          text: searchText,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({
      page: "1",
      limit: String(queryLimit),
      order: queryOrder,
      type: searchType,
      text: searchText,
    });
  };

  const handlePageChange = (page) => {
    setSearchParams({
      page: String(page),
      limit: String(queryLimit),
      order: queryOrder,
      type: querySearchType,
      text: querySearchText,
    });
  };

  const goDetail = (noticeId) => {
    navigate(`/notice/detail?id=${noticeId}&from=${queryPage}`);
  };

  // 블록 페이지네이션
  const renderPagination = () => {
    const pageBlockSize = 10;
    const currentBlock = Math.floor((queryPage - 1) / pageBlockSize);
    const startPage = currentBlock * pageBlockSize + 1;
    const endPage = Math.min(startPage + pageBlockSize - 1, meta.totalPages);

    const btn = (label, onClick, disabled, active) => (
      <button
        key={label}
        onClick={onClick}
        disabled={disabled}
        className={classNames({
          'active': active
        })}
      >
        {label}
      </button>
    );

    const buttons = [];
    buttons.push(btn('처음', () => handlePageChange(1), queryPage === 1));
    buttons.push(btn('이전', () => handlePageChange(Math.max(queryPage - 1, 1)), queryPage === 1));
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(btn(String(i), () => handlePageChange(i), false, queryPage === i));
    }
    buttons.push(btn('다음', () => handlePageChange(Math.min(queryPage + 1, meta.totalPages)), queryPage === meta.totalPages));
    buttons.push(btn('끝', () => handlePageChange(meta.totalPages), queryPage === meta.totalPages));
    return buttons;
  };

  return (
    <div>
      <div className={styles.bannerWrap}>
        <Banner text="공지사항" />
      </div>
      <Breadcrumb />

      <div className={styles.boardContainer}>
        <div className={styles.boardHeader}>
          <div>전체 <strong className={styles.countBadge}>{meta.totalItems}</strong> 건</div>
          {isAdmin && (
            <button
              className={classNames(styles.btn, styles.btnPrimary)}
              onClick={() => navigate('/notice/write')}
            >
              글쓰기
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.row} style={{ marginBottom: '1.5rem' }}>
          <select className={styles.select} value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="title">제목</option>
            <option value="title_content">제목+내용</option>
          </select>
          <input
            className={styles.input}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="검색어 입력"
          />
          <button type="submit" className={classNames(styles.btn, styles.btnPrimary, styles.btnAnimated)}>검색</button>
        </form>

        {loading ? (
          <div className={styles.helperText} style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
        ) : error ? (
          <div className={styles.muted} style={{ textAlign: 'center', padding: '2rem' }}>{error}</div>
        ) : (
          <table className={styles.boardTable}>
            <thead>
              <tr>
                <th>번호</th>
                <th style={{ textAlign: 'left' }}>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>조회수</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => (
                <tr key={notice.id} onClick={() => goDetail(notice.id)} style={{ cursor: 'pointer' }}>
                  <td>{notice.displayNo}</td>
                  <td style={{ textAlign: 'left' }}>{notice.title}</td>
                  <td>{notice.author}</td>
                  <td>{notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : '-'}</td>
                  <td>{Number.isFinite(notice?.views) ? notice.views : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.pagination}>
          {renderPagination().map((btn, i) =>
            React.cloneElement(btn, {
              key: i,
              className: classNames(styles.pageBtn, {
                [styles.pageBtnActive]: btn.props.className === 'active'
              })
            })
          )}
        </div>
      </div>
    </div>
  );
}