# 함께찾개 프론트엔드

반려견 찾기 서비스의 프론트엔드 프로젝트입니다.


## 주요 기능

* **AI 성견 모습 예측 기반 검색:** 강아지 시절 사진을 업로드하면 AI가 예상 성견 모습을 생성하여 매칭에 활용합니다.
* **이미지 기반 유사견 탐색:** CLIP 임베딩 기술을 활용하여 DB 내 유기견과 유사도를 비교하고 목록을 제시합니다.
* **정밀 필터링:** AI 검색 결과에 지역, 품종, 성별 등의 조건을 추가하여 검색의 정확도를 높입니다.
* **입양/신고 프로세스:** 유기견 신고 접수 및 입양 신청 처리 기능.
* **보호소 찾기:** Kakao Maps API를 활용한 보호소 위치 시각화 및 정보 제공.

  
## 성견 예측과 유사견 검색 화면

1. [검색 화면](src/pages/Lookup/LookupMain.jsx)에서 사진을 선택하고 미리보기로 확인합니다.
2. [성견 예측 화면](src/pages/Lookup/PredictDog.jsx)에서 예측 이미지를 확인하고 유사견 검색을 요청합니다.
3. [검색 결과 화면](src/pages/Lookup/SearchResultPage.jsx)에서 유사견 목록을 확인하고 상세 화면으로 이동합니다.

## 기술 스택

| 구분 | 기술 스택 | 비고 |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router | 사용자 인터페이스 구현 및 라우팅 |
| **Styling** | CSS, CSS Modules | 전역 및 화면별 스타일링 |
| **API** | REST API | Spring Boot 기반의 백엔드 서버와 비동기 통신 |
| **Map** | Kakao Maps API | 보호소 위치 및 지도 시각화 |


## 프로젝트 구조

- `src/components/` - 재사용 가능한 UI 컴포넌트 모음
- `src/pages/` - 라우팅 및 핵심 비즈니스 로직을 포함하는 페이지 컴포넌트 
- `src/contexts/` - React Context 파일들
- `src/styles/` - 전역 스타일 및 유틸리티 CSS 파일

## 로컬 실행

Node.js와 npm을 설치한 뒤 저장소 루트에서 실행합니다.

```bash
cd Frontend
npm ci
npm run dev
```

터미널에 표시된 주소(기본값 `http://localhost:5173`)에서 화면을 열 수 있습니다.

### API 기능 확인

- Vite 개발 서버는 `/api`와 `/auth` 요청을 [vite.config.js](vite.config.js)의 `BACKEND_URL`에 지정된 서버로 전달합니다. 기본값은 ngrok 터널 주소입니다. 다른 개발 서버를 사용한다면 이 값을 실행 중인 백엔드 주소로 수정한 뒤 Vite를 다시 시작하세요.
- 공지 상세와 문의 수정 화면은 `VITE_API_URL`을 참조합니다. 해당 화면을 확인할 때는 `Frontend/.env.local`에 실행 중인 API 서버 주소를 지정하세요.
- 예측과 유사견 검색까지 확인하려면 연결한 백엔드에서 해당 API가 동작해야 합니다. 백엔드 구성은 [백엔드 README](../Backend/README.md)를 참고하세요.
