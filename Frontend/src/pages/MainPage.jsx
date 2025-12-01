import React, {useContext} from 'react';
import Banner from '@/components/Mainpage/Banner';
import NoticePreview from '@/components/MainpageCard/NoticePreview';
import ShelterSearchCard from '@/components/MainpageCard/ShelterSearchCard';
import AdoptPreview from '@/components/MainpageCard/AdoptPreview';
import FeaturePromotion from '@/components/MainpageCard/FeaturePromotion';
import LookupPreview from '@/components/MainpageCard/LookupPreview';
import ReportPreview from '@/components/MainpageCard/ReportPreview';


export default function MainPage() {

  return (
    <div style={{ backgroundColor: '#fff', paddingBottom: '4rem' }}>
      {/* 상단 배너 */}
      <Banner
        text="여러분의 소중한 가족을 함께 찾아드립니다"
        fontSize= "2.5rem"
      />

      {/* 요약 섹션들 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          minHeight: '300px',
          margin: '3rem auto',
          padding: '0 2rem',
        }}
      >
        <LookupPreview />
        <ReportPreview /> 
        <AdoptPreview />
        <ShelterSearchCard />
        <NoticePreview />
      </div>

      {/* 기능 홍보 섹션 */}
      <FeaturePromotion />
    </div>
  );
}
