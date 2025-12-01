import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from '@/styles/pages/detail.module.css'; 

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const token = localStorage.getItem("token");

  const [qPage, setQPage] = useState(0);
  const [qData, setQData] = useState({ content: [], totalPages: 0, number: 0 });

  const [rPage, setRPage] = useState(0);
  const [rData, setRData] = useState({ content: [], totalPages: 0, number: 0 });

  const size = 10;

  const loadDetail = async () => {
    try {
      const res = await axios.get(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetail(res.data);
    } catch (e) {
      console.error(e);
      setDetail(false);
    }
  };

  const loadInquiries = async () => {
    try {
      const res = await axios.get(`/api/admin/users/${id}/inquiries`, { 
        params: { page: qPage, size },
        headers: { Authorization: `Bearer ${token}` }
      });
      setQData(res.data);
    } catch (e) {
      console.error(e);
      setQData({ content: [], totalPages: 0, number: 0 });
    }
  };

  const loadReports = async () => {
    try {
      const res = await axios.get(`/api/admin/users/${id}/lost-reports`, { 
        params: { page: rPage, size },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRData(res.data);
    } catch (e) {
      console.error(e);
      setRData({ content: [], totalPages: 0, number: 0 });
    }
  };

  useEffect(() => { loadDetail(); }, [id]);
  useEffect(() => { loadInquiries(); }, [id, qPage]);
  useEffect(() => { loadReports(); }, [id, rPage]);

  if (detail === null) return <div className={styles.loadingBox}>로딩중...</div>;
  if (detail === false) return <div className={styles.errorBox}>회원 정보를 불러오지 못했습니다.</div>;

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailTopbar}>
        <button onClick={() => navigate(-1)} className={`${styles.btn} ${styles.btnOutline}`}>
          {'<'} 목록
        </button>
      </div>

      {/* 회원 상세 정보 */}
      <Section title="회원 정보">
        <InfoRow label="UserID" value={detail.userid} />
        <InfoRow label="닉네임" value={detail.nickname} />
        <InfoRow label="Email" value={detail.email ?? '-'} />
        <InfoRow label="Role" value={detail.role} />
        <InfoRow label="가입일" value={new Date(detail.createdAt).toLocaleString()} />
        <InfoRow label="문의글 수" value={detail.inquiryCount} />
        <InfoRow label="신고글 수" value={detail.lostReportCount} />
      </Section>

      {/* 문의글 목록 */}
      <div className={styles.detailSection}>
        <h3 className={styles.detailSectionTitle}>문의글 목록</h3>
        <table className={styles.detailTable}>
          <thead>
            <tr>
              <th className={styles.detailTh}>제목</th>
              <th className={styles.detailTh}>공개</th>
              <th className={styles.detailTh}>작성일</th>
              <th className={styles.detailTh}>답변</th>
            </tr>
          </thead>
          <tbody>
            {qData.content.length > 0 ? (
              qData.content.map(row => (
                <tr className={styles.detailTr} key={row.id}>
                  <td className={styles.detailTd}>
                    <Link to={`/inquiry/detail?id=${row.id}`}>{row.title}</Link>
                  </td>
                  <td className={styles.detailTd}>{row.isPublic ? '공개' : '비공개'}</td>
                  <td className={styles.detailTd}>{new Date(row.createdAt).toLocaleString()}</td>
                  <td className={styles.detailTd}>{row.answered ? 'Y' : 'N'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className={styles.textMuted}>문의글이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        {qData.totalPages > 1 && (
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <button 
              disabled={qPage === 0} 
              onClick={() => setQPage(p => p - 1)} 
              className={`${styles.btn} ${styles.btnOutline}`}
            >
              이전
            </button>
            <span style={{ margin: '0 8px' }}>{qData.number + 1} / {qData.totalPages}</span>
            <button 
              disabled={qPage + 1 >= qData.totalPages} 
              onClick={() => setQPage(p => p + 1)} 
              className={`${styles.btn} ${styles.btnOutline}`}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 신고글 목록 */}
      <div className={styles.detailSection}>
        <h3 className={styles.detailSectionTitle}>신고글(분실신고) 목록</h3>
        <table className={styles.detailTable}>
          <thead>
            <tr>
              <th className={styles.detailTh}>제목</th>
              <th className={styles.detailTh}>종</th>
              <th className={styles.detailTh}>성별</th>
              <th className={styles.detailTh}>작성일</th>
              <th className={styles.detailTh}>분실일</th>
            </tr>
          </thead>
          <tbody>
            {rData.content.length > 0 ? (
              rData.content.map(row => (
                <tr className={styles.detailTr} key={row.id}>
                  <td className={styles.detailTd}>
                    <Link to={`/report/view/detail?id=${row.id}`}>{row.dogName || row.title || '제목 없음'}</Link>
                  </td>
                  <td className={styles.detailTd}>{row.species}</td>
                  <td className={styles.detailTd}>{row.gender}</td>
                  <td className={styles.detailTd}>{new Date(row.createdAt).toLocaleString()}</td>
                  <td className={styles.detailTd}>{row.dateLost ? new Date(row.dateLost).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className={styles.textMuted}>신고글이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        {rData.totalPages > 1 && (
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <button 
              disabled={rPage === 0} 
              onClick={() => setRPage(p => p - 1)} 
              className={`${styles.btn} ${styles.btnOutline}`}
            >
              이전
            </button>
            <span style={{ margin: '0 8px' }}>{rData.number + 1} / {rData.totalPages}</span>
            <button 
              disabled={rPage + 1 >= rData.totalPages} 
              onClick={() => setRPage(p => p + 1)} 
              className={`${styles.btn} ${styles.btnOutline}`}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 회원 삭제 버튼 */}
      <div className={styles.detailButtons}>
        <button
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={async () => {
            if (!window.confirm('정말 이 회원을 삭제하시겠습니까?')) return;
            try {
              await axios.delete(`/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              alert('삭제가 완료되었습니다.');
              navigate('/adminpage/users');
            } catch (e) {
              console.error(e);
              alert('삭제 중 오류가 발생했습니다.');
            }
          }}
        >
          회원 삭제
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className={styles.detailSection}>
      <h3 className={styles.detailSectionTitle}>{title}</h3>
      <table className={styles.detailTable}>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <tr className={styles.detailTr}>
      <th className={styles.detailTh}>{label}</th>
      <td className={styles.detailTd}>{value}</td>
    </tr>
  );
}
