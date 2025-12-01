import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import styles from '@/styles/pages/pages.module.css'; // .module.css 파일 임포트

export default function ReportHow() {
  const navigate = useNavigate();

  return (
    <div>
      <div className={styles.bannerWrap}>
        <Banner
          text="유기견 신고 방법 안내"
        />
      </div>

      <Breadcrumb />
      <div className={styles.contentWrap}>
        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>1. 신고 대상 확인</h2>
          <ul className={styles.infoList}>
            <li><strong>유기동물</strong>: 소유자가 없이 공공장소 등에서 발견된 동물</li>
            <li><strong>주인이 있는 반려동물</strong>: 목줄, 인식표, 등록칩 확인 후 동물병원이나 시군구청 문의</li>
          </ul>
        </section>

        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>2. 어디에 신고하나요?</h2>
          <ul className={styles.infoList}>
            <li>가까운 <strong>시·군·구청</strong> 또는 <strong>동물보호센터</strong>에 신고합니다.</li>
            <li>온라인 신고는 <a href="https://www.animal.go.kr/" target="_blank" rel="noopener noreferrer">동물보호관리시스템</a>에서 가능합니다.</li>
          </ul>
        </section>

        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>3. 신고 시 필요한 정보</h2>
          <ul className={styles.infoList}>
            <li>발견 장소</li>
            <li>발견 일시</li>
            <li>동물의 종류, 색상, 크기, 특징</li>
            <li>가능하다면 사진 첨부</li>
          </ul>
        </section>

        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>4. 직접 구조했을 경우</h2>
          <p>근처 <strong>공식 보호소</strong> 또는 <strong>위탁 보호소</strong>에 인계해주세요.</p>
          <button onClick={() => navigate('/shelters')} className={`${styles.btn} ${styles.btnPrimary}`}>
            <Link to="/shelters" style={{ textDecoration: 'none', color: 'white' }}>
              보호소 찾기
            </Link>
          </button>
        </section>

        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>5. 유의사항</h2>
          <ul className={styles.infoList}>
            <li>입양을 원할 경우, 신고 시 함께 의사 표현</li>
            <li>무단 포획 및 방치 금지</li>
            <li>SNS에 공유하여 주인 찾기 병행 가능</li>
          </ul>
        </section>

        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>6. 관련 문의</h2>
          <ul className={styles.infoList}>
            <li><strong>120 다산콜센터</strong></li>
            <li>각 지자체 동물보호 부서</li>
          </ul>
        </section>
      </div>
    </div>
  );
}