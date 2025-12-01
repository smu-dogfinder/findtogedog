import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Banner from '@/components/Mainpage/Banner';
import axios from 'axios';
import styles from '@/styles/pages/detail.module.css'; // .module.css 파일 임포트

export default function DogDetail_1() {
  const { dogId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [dog, setDog] = useState(null);

  useEffect(() => {
    axios
      .get(`/api/dog-details/${dogId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      })
      .then((res) => setDog(res.data))
      .catch((err) => console.error(err));
  }, [dogId]);

  const handleGoBack = () => {
    sessionStorage.setItem('visitedByBack', 'true');
    const from = location.state?.from;
    if (from === '/lookup') navigate('/lookup');
    else navigate('/lookup/predict-dog');
  };

  if (!dog) return <p className={styles.detailPage}>로딩 중...</p>;

  return (
    <div>
      <Banner text="유기견 상세 조회" />

      <div className={styles.detailPage}>
        <div className={styles.detailTopbar}>
          <button onClick={handleGoBack} className={`${styles.btn} ${styles.btnOutline}`}>
            {'<'} 목록
          </button>
        </div>

        <div className={styles.detailHero}>
          <img src={dog.imagePath || '/default-dog.jpg'} alt="dog" />
        </div>

        <Section title="공고 정보">
          <InfoRow label="공고번호" value={dog.number || '-'} />
          <InfoRow label="보호소명" value={dog.shelterId || '-'} />
          <InfoRow label="등록일" value={dog.createdAt?.slice(0, 10) || '-'} />
          <InfoRow label="보호 상태" value={dog.state || '-'} />
        </Section>

        <Section title="발견 일시 및 장소">
          <InfoRow label="발견일자" value={dog.foundDate || '-'} />
          <InfoRow label="발견장소" value={dog.foundLocation || '-'} />
          <InfoRow label="관할기관" value={dog.jurisd || '-'} />
        </Section>

        <Section title="동물 정보">
          <InfoRow label="품종" value={dog.species || '-'} />
          <InfoRow label="색상" value={dog.color || '-'} />
          <InfoRow label="성별" value={dog.gender || '-'} />
          <InfoRow label="나이" value={dog.age || '-'} />
          <InfoRow label="중성화 여부" value={dog.neutYn || '-'} />
        </Section>
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