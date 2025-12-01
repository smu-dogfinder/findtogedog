import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import '../../styles/FeaturePromotion.css';

const slides = [
  {
    title: '잃어버린 반려견, 이제는 AI와 \'함께찾개\''
  },
  {
    number: '기능 1',
    title: 'AI로 유기견 찾기',
    description: '사진을 업로드하면 유사한 유기견을 찾아드립니다.',
    link: '/lookup',
  },
  {
    number: '기능 2',
    title: '생성형 AI로 유기견 성견 예측',
    description: '어릴 적 잃어버린 강아지 사진을 업로드하면 성장한 모습을 예측해드립니다.',
    link: '/lookup/predict-dog',
  },
  {
    number: '기능 3',
    title: '유기견 입양 안내',
    description: '입양 절차를 알아보고, 입양 가능한 유기견을 찾아보세요.',
    link: '/adopt',
  },
  {
    number: '기능 4',
    title: '위치 기반 보호소 검색',
    description: '현재 위치 또는 지역 선택을 통해 근처의 보호소를 쉽게 찾아보세요.',
    link: '/shelters',
  },
];


export default function FeatureSlider() {
  return (
    <div className="feature-slider-container">
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation={{
          nextEl: '.custom-next',
          prevEl: '.custom-prev',
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop
        className="feature-swiper"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <a href={slide.link} className="feature-slide">
              <div className="feature-text">
                <h3 className={index === 0 ? 'feature-title large' : 'feature-title'}>
                  <span className="highlight-number">{slide.number}</span> {slide.title}
                </h3>
                <p>{slide.description}</p>
              </div>
            </a>
          </SwiperSlide>
        ))}

        <div className="custom-prev">&#60;</div>
        <div className="custom-next">&#62;</div>
      </Swiper>
    </div>
  );
}
