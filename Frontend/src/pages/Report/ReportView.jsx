import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Banner from '@/components/Mainpage/Banner';
import axios from 'axios';
import { LoginContext } from '@/contexts/LoginContext';
import classNames from 'classnames'; 
import styles from '@/styles/pages/detail.module.css'; 

export default function ReportLostView() {
  const [searchParams] = useSearchParams();
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const id = searchParams.get('id') || 1;
  const from = searchParams.get('from') || 1;
  const navigate = useNavigate();

  const { user } = useContext(LoginContext);
  const meUserid = user?.userid ?? user?.id ?? null;
  const isAdmin = user?.role === 'ADMIN' || user?.roles?.includes?.('ADMIN');
  
  const handleBackToList = () => {
    navigate(`/report?page=${from}`);
  };

  const defaultDogInfo = {
    nickName: '신고자 정보 없음',
    dateLost: '분실 날짜 정보 없음',
    placeLost: '분실 장소 정보 없음',
    species: '품종 정보 없음',
    gender: '성별 정보 없음',
    dogName: '이름 정보 없음',
    content: '특징 정보 없음',
    phone: '연락처 정보 없음',
    imagePath: '/imageupload/default.png',
  };

  const normalizeItem = (raw) => ({
    ...defaultDogInfo,
    ...raw,
    nickName: raw?.nickName ?? raw?.nickname ?? raw?.authorNickname ?? defaultDogInfo.nickName,
    authorUserid: raw?.authorUserid ?? raw?.userId ?? raw?.userid ?? null,
  });

  useEffect(() => {
    const fetchMissingDogs = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/lost-pet/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });

        const raw = response?.data?.data ?? response?.data ?? null;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const normalized = list.map(normalizeItem);
        setDogs(normalized);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
        setDogs([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMissingDogs();
  }, [id, from, navigate]);

  const handleEdit = () => {
    navigate(`/report/edit?id=${id}&from=${from}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('accessToken');
    try {
      await axios.delete(`/api/lost-pet/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          'ngrok-skip-browser-warning': 'true' 
        },
      });
      alert('삭제되었습니다.');
      handleBackToList();
    } catch (err) {
      console.error(err);
      const code = err?.response?.status;
      if (code === 403) alert('삭제 권한이 없습니다.');
      else if (code === 401) alert('로그인이 필요합니다.');
      else alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <Banner text="반려동물 분실 신고 조회" />

      <div className={styles.detailPage}>
        <div className={styles.detailTopbar}>
          <button onClick={handleBackToList} className={classNames(styles.btn, styles.btnOutline)}>
            {'<'} 목록
          </button>
        </div>

        {loading ? (
          <p>로딩 중...</p>
        ) : dogs.length === 0 ? (
          <p>조회된 분실 신고가 없습니다.</p>
        ) : (
          dogs.map((dog, index) => {
            const info = { ...defaultDogInfo, ...dog };

            return (
              <div key={index}>
                <div className={styles.detailHero}>
                  {info.imagePath && info.imagePath !== defaultDogInfo.imagePath ? (
                    <img
                      src={`/api/lost-pet/images${info.imagePath}`}
                      alt="lost-pet"
                    />
                  ) : (
                    <div className={styles.reportImagePlaceholder}>첨부된 이미지가 없습니다.</div>
                  )}
                </div>

                {/* 신고자 정보 */}
                <Section title="신고자 정보">
                  <InfoRow label="신고자" value={info.nickName} />
                  <InfoRow label="연락처" value={info.phone} />
                </Section>

                {/* 분실동물 정보 */}
                <Section title="분실동물 정보">
                  <InfoRow label="이름" value={info.dogName} />
                  <InfoRow label="품종" value={info.species} />
                  <InfoRow label="성별" value={info.gender} />
                  <InfoRow label="특징" value={info.content} />
                  <InfoRow
                    label="분실날짜"
                    value={
                      info.dateLost !== defaultDogInfo.dateLost
                        ? new Date(info.dateLost).toLocaleDateString('ko-KR')
                        : info.dateLost
                    }
                  />
                  <InfoRow label="분실장소" value={info.placeLost} />
                </Section>

                <p className={styles.reportNotice}>※발견하신 분들은 신고자 번호로 연락 부탁드립니다.※</p>
              </div>
            );
          })
        )}
        {!loading && dogs[0] && (
            (() => {
              const post = dogs[0];
              const isOwner = post.authorUserid && meUserid && String(post.authorUserid) === String(meUserid);
                return (
                <div className={styles.detailActions}>
                  {isOwner && (
                    <button className={classNames(styles.btn, styles.btnSecondary)} onClick={handleEdit}>수정</button> // 작성자만
                  )}
                  {(isOwner || isAdmin) && (
                    <button className={classNames(styles.btn, styles.btnDanger)} onClick={handleDelete}>삭제</button> // 작성자 또는 관리자
                  )}
                </div>
              );
            })()
          )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className={styles.detailSection}>
      <h3 className={styles.detailSectionTitle}>🐾 {title}</h3>
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