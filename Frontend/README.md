# Dog Finder Frontend

반려견 찾기 서비스의 프론트엔드 프로젝트입니다.


## 주요 기능

* **AI 성견 모습 예측 기반 검색:** 강아지 시절 사진을 업로드하면 AI가 예상 성견 모습을 생성하여 매칭에 활용합니다.
* **이미지 기반 유사견 탐색:** CLIP 임베딩 기술을 활용하여 DB 내 유기견과 유사도를 비교하고 목록을 제시합니다.
* **정밀 필터링:** AI 검색 결과에 지역, 품종, 성별 등의 조건을 추가하여 검색의 정확도를 높입니다.
* **입양/신고 프로세스:** 유기견 신고 접수 및 입양 신청 처리 기능.
* **보호소 찾기:** Kakao Maps API를 활용한 보호소 위치 시각화 및 정보 제공.

  
## 기술 스택

| 구분 | 기술 스택 | 비고 |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router | 사용자 인터페이스 구현 및 라우팅 |
| **Styling** | SCSS / Styled-Components (필요시 명시) | 컴포넌트 기반 스타일링 |
| **API** | REST API | Spring Boot 기반의 백엔드 서버와 비동기 통신 |
| **Map** | Kakao Maps API | 보호소 위치 및 지도 시각화 |


## 프로젝트 구조

- `src/components/` - 재사용 가능한 UI 컴포넌트 모음
- `src/pages/` - 라우팅 및 핵심 비즈니스 로직을 포함하는 페이지 컴포넌트 
- `src/contexts/` - React Context 파일들
- `src/styles/` - 전역 스타일 및 유틸리티 CSS 파일


  ## 실행 방법

로컬 환경에서 프로젝트를 실행하는 방법입니다. (Node.js 및 npm 설치 필수)

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 환경 서버 실행 (http://localhost:5173 에서 확인 가능)
npm run dev
```
