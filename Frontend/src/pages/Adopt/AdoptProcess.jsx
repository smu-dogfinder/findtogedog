import React from 'react';
import Banner from '../../components/Mainpage/Banner';
import Breadcrumb from '../../components/Breadcrumb';
import styles from '@/styles/pages/pages.module.css'; // .module.css 파일 임포트

export default function AdoptProcess() {
  return (
    <div>
      {/* 배너 영역 */}
      <div className={styles.bannerWrap}>
        {/* 상단 배너 */}
        <Banner text="입양 절차 안내" />
      </div>

      <Breadcrumb />

      <div className={styles.contentWrap}>
        <section className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>1. 입양 전 유의사항</h2>
          <ul>
            <li>반려동물은 가족입니다. 평생 책임질 준비가 되었는지 스스로 점검해보세요.</li>
            <li>사료, 병원비, 미용 등 매월 고정적인 비용이 발생합니다.</li>
            <li>동물의 습성과 돌봄에 대한 이해가 필요합니다.</li>
            <li>입양 후 파양은 동물에게 큰 상처가 되므로 신중히 결정해주세요.</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>2. 입양 절차 단계</h2>
          <ul>
            <li>
              <strong>1단계: 보호동물 검색</strong> – 유기동물 입양 페이지에서 입양 가능한 동물을 확인합니다.
            </li>
            <li>
              <strong>2단계: 문의 및 상담</strong> – 보호소 또는 운영기관에 연락하여 입양 의사 전달 및 기본 상담 진행
            </li>
            <li>
              <strong>3단계: 서류 제출</strong> – 입양 신청서, 신분증 사본, 반려동물 양육 환경 사진 등 제출
            </li>
            <li>
              <strong>4단계: 입양 승인</strong> – 보호소 담당자의 심사 후 입양 승인 여부 통보
            </li>
            <li>
              <strong>5단계: 입양 진행</strong> – 서약서 작성 및 동물 인계
            </li>
            <li>
              <strong>6단계: 동물 등록</strong> – 입양 완료 후 30일 이내 동물 등록 필수
            </li>
          </ul>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>3. 제출 서류 목록</h2>
          <ul>
            <li>입양 신청서</li>
            <li>신분증 사본 (주민등록증 또는 운전면허증)</li>
            <li>거주지 확인 자료 (등본, 임대차계약서 등)</li>
            <li>반려동물 양육 환경 사진 (거실, 베란다, 펜스 등)</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>4. 자주 묻는 질문(FAQ)</h2>
          <ul>
            <li>
              <strong>Q.</strong> 입양 후 다시 돌려보낼 수 있나요?<br />
              <strong>A.</strong> 보호소마다 다르지만, 대부분 부득이한 사정 외 파양을 제한하고 있습니다.
            </li>
            <li>
              <strong>Q.</strong> 입양 전 미리 방문할 수 있나요?<br />
              <strong>A.</strong> 방문하실 보호소에 사전 전화 예약 후 방문 상담이 가능합니다.
            </li>
            <li>
              <strong>Q.</strong> 집에 기존 반려동물이 있어도 입양 가능할까요?<br />
              <strong>A.</strong> 기존 동물의 성향에 따라 보호소와 입양 가능 여부를 협의합니다.
            </li>
          </ul>
        </section>
      </div>

      <footer className={styles.noticeFooter}>
        ※ 본 사이트는 입양 절차를 직접 진행하지 않으며, 입양 가능한 보호소 또는 운영기관의 연락처 및 주소만 제공한다는 점을 알립니다. ※
      </footer>
    </div>
  );
}