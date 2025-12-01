import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { InquiryContext } from '@/contexts/InquiryContext';
import { LoginContext } from '@/contexts/LoginContext';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/detail.module.css'; // .module.css 파일 임포트

export default function InquiryDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(LoginContext);

  const meNickname = user?.nickName ?? null;
  const meUserid = user?.userid ?? user?.id ?? null;
  const isAdmin = !!(user?.role && String(user.role).toUpperCase().includes('ADMIN'));
  const token = Cookies.get('token');

  const searchParams = new URLSearchParams(location.search);
  const idParam = searchParams.get('id');
  const id = idParam ? parseInt(idParam, 10) : null;
  const from = searchParams.get('from') || '1';

  const { inquiry, setInquiry } = useContext(InquiryContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');

  // 인라인 편집 상태
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const handledRef = useRef(false);
  const PRIVATE_MSG = '비공개 글입니다. 작성자만 열람할 수 있습니다.';

  const normalizeInquiry = (raw) => ({
    id: raw.id,
    title: raw.title,
    content: raw.content,
    authorNickname: raw.authorNickname ?? raw.nickname ?? raw.author ?? '글쓴이',
    authorUserid: raw.authorUserid ?? raw.userId ?? raw.userid ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    isPublic:
      typeof raw.is_public !== 'undefined'
        ? Boolean(raw.is_public)
        : typeof raw.isPublic !== 'undefined'
        ? Boolean(raw.isPublic)
        : !raw.isPrivate,
    files: raw.files ?? [],
  });

  const denyAndBack = () => {
    if (handledRef.current) return;
    handledRef.current = true;
    alert(PRIVATE_MSG);
    navigate(`/inquiry?page=${from}`, { replace: true });
    return;
  };

  const fetchReplies = async () => {
    try {
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await axios.get(`/api/inquiries/${id}/replies`, { headers });
      setReplies(res.data || []);
    } catch (err) {
      console.warn('댓글 조회 실패(무시):', err?.response?.status, err?.response?.data || err.message);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setInquiry(null);
    handledRef.current = false;

    if (id === null) {
      setError('유효한 문의글 ID가 없습니다.');
      setLoading(false);
      return;
    }

    if (!user || !user.id) {
      return;
    }

    const fetchInquiry = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = { 'ngrok-skip-browser-warning': 'true' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await axios.get(`/api/inquiries/${id}`, {
          headers,
          signal: controller.signal,
        });

        const raw = res.data?.data ?? res.data;
        if (!raw || !raw.id) throw new Error('empty-inquiry');
        const item = normalizeInquiry(raw);

        const isMineCheck =
          item.authorUserid && meUserid
            ? item.authorUserid === meUserid
            : item.authorNickname === meNickname;

        const isAllowed = item.isPublic || isAdmin || isMineCheck;

        if (!isAllowed) {
          denyAndBack();
          return;
        }

        setInquiry(item);
        fetchReplies();
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error('에러 발생:', err);

        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 400 || status === 403) {
            denyAndBack();
            return;
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInquiry();
    return () => controller.abort();
  }, [id, user, token, navigate, setInquiry, meUserid, meNickname, isAdmin]);

  // 댓글 등록
  const handleReplySubmit = async () => {
    const content = replyContent.trim();
    if (!content) {
      alert('내용을 입력해주세요.');
      return;
    }
    try {
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      if (token) headers.Authorization = `Bearer ${token}`;
      await axios.post(
        `/api/inquiries/${id}/replies`,
        { content, isPublic: true },
        { headers }
      );
      setReplyContent('');
      await fetchReplies();
    } catch (err) {
      alert('댓글 등록에 실패했습니다.');
      console.error(err);
    }
  };

  // 댓글 삭제 (관리자 전용)
  const handleReplyDelete = async (replyId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      if (token) headers.Authorization = `Bearer ${token}`;
      await axios.delete(`/api/inquiries/${id}/replies/${replyId}`, { headers });
      await fetchReplies();
    } catch (err) {
      console.error(err);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 수정 시작/취소/저장 (관리자 전용)
  const startEdit = (reply) => {
    setEditingId(reply.id);
    setEditingContent(reply.content ?? '');
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };
  const handleReplyUpdate = async () => {
    const content = editingContent.trim();
    if (!content) {
      alert('내용을 입력해주세요.');
      return;
    }
    try {
      const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      await axios.patch(
        `/api/inquiries/${id}/replies/${editingId}`,
        { content }, // 필요 시 { content, isPublic: true }
        { headers }
      );

      setEditingId(null);
      setEditingContent('');
      await fetchReplies();
    } catch (err) {
      console.error(err);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className={classNames(styles.detailContainer, styles.loadingBox)}>
        로딩 중...
      </div>
    );
  }
  if (error) {
    return (
      <div className={classNames(styles.detailContainer, styles.errorBox)}>
        {error}
      </div>
    );
  }
  if (!inquiry || inquiry.id !== id) {
    return (
      <div className={classNames(styles.detailContainer, styles.loadingBox)}>
        문의 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const isMine =
    inquiry.authorUserid && meUserid
      ? inquiry.authorUserid === meUserid
      : inquiry.authorNickname === meNickname;

  const isAdminUI = !!(user?.role && String(user.role).toUpperCase().includes('ADMIN'));

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detailInner}>
        <h2 className={styles.detailTitle}>{inquiry.title}</h2>
        <div className={styles.detailMeta}>
          작성자: {inquiry.authorNickname} | 작성일:{' '}
          {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : '-'}
        </div>

        <div className={styles.detailContent}>{inquiry.content}</div>

        {/* 관리자 답변 섹션 */}
        <div style={{ marginTop: '2rem' }}>
          <h3>관리자 답변</h3>
          {replies.length === 0 ? (
            <div style={{ color: '#999' }}>아직 댓글이 없습니다.</div>
          ) : (
            replies.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <div
                  key={r.id}
                  className={styles.replyContainer}
                >
                  <strong>{r.adminNickname}</strong>
                  <div className={styles.textMuted}>
                    {new Date(r.createdAt).toLocaleString()}
                  </div>

                  {!isEditing ? (
                    <div>{r.content}</div>
                  ) : (
                    <>
                      <textarea
                        value={editingContent}
                        onChange={(e) => {
                          setEditingContent(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={(e) => {
                          // 한글/일본어 입력 조합 중일 때는 엔터 무시
                          if (e.isComposing || e.nativeEvent.isComposing) return;
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReplyUpdate();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEdit();
                          }
                        }}
                        rows={1}
                        placeholder="내용을 수정하세요 (Enter 저장, Shift+Enter 줄바꿈, Esc 취소)"
                        className={styles.replyTextarea}
                        autoFocus
                      />
                      <div className={styles.textMuted}>
                        Enter 저장 · Shift+Enter 줄바꿈 · Esc 취소
                      </div>
                    </>
                  )}

                  {isAdminUI && !isEditing && (
                    <div className={styles.replyActions}>
                      <button
                        onClick={() => startEdit(r)}
                        className={classNames(styles.btn, styles.btnSecondary, styles.smallBtn)} // classnames 적용
                        title="댓글 수정"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleReplyDelete(r.id)}
                        className={classNames(styles.btn, styles.btnDanger, styles.smallBtn)} // classnames 적용
                        title="댓글 삭제"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 관리자만 댓글 작성 */}
        {isAdminUI && (
          <div style={{ marginTop: '2rem' }}>
            <h4>댓글 작성</h4>
            <textarea
              value={replyContent}
              onChange={(e) => {
                setReplyContent(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.isComposing || e.nativeEvent.isComposing) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReplySubmit();
                }
              }}
              rows={1}
              placeholder="댓글을 입력하세요"
              className={styles.replyTextarea}
            />
          </div>
        )}

        {/* 하단 버튼 */}
        <div className={styles.detailButtons}>
          {isMine && (
            <>
              <button
                onClick={() => navigate(`/inquiry/edit?id=${id}`)}
                className={classNames(styles.btn, styles.btnSecondary)} // classnames 적용
              >
                수정하기
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm('정말 삭제하시겠습니까?')) return;
                  try {
                    const headers = { 'ngrok-skip-browser-warning': 'true' };
                    if (token) headers.Authorization = `Bearer ${token}`;
                    await axios.delete(`/api/inquiries/${id}`, { headers });
                    alert('삭제되었습니다.');
                    navigate(`/inquiry?page=${from}`);
                  } catch (err) {
                    alert('삭제에 실패했습니다.');
                    console.error(err);
                  }
                }}
                className={classNames(styles.btn, styles.btnDanger)} // classnames 적용
              >
                삭제하기
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/inquiry?page=${from}`)}
            className={classNames(styles.btn, styles.btnPrimary)} // classnames 적용
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
}