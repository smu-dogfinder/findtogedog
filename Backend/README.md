# Animal Shelter API

유기동물 보호소 관리 시스템 백엔드


## 주요 기능

* **API 게이트웨이 역할:** AI 서버(이미지 생성/검색)로의 요청을 중계하고 결과를 취합하여 프론트엔드에 전달합니다.
* **유기동물 정보 관리:** 공공 데이터 포털에서 수집된 유기동물 및 보호소 정보 DB 관리 및 서비스 로직을 수행합니다.
* **사용자 인증 및 권한 관리 (JWT)**: 모든 서비스 요청에 대한 인증 처리를 담당합니다.
* **CRUD 관리:** 분실 신고, 공지사항 등 핵심 데이터의 생성, 조회, 수정, 삭제를 관리합니다.

  
## 기술 스택
-   Spring Boot 3.2.5
-   MySQL (Spring Data JPA 활용)
-   JWT 인증/인가
-   RestTemplate / WebClient (AI 서버 연동)
-   Java 17 (필수)

## 실행 방법

1. `application-example.yml`을 복사해서 `application-local.yml`로 생성합니다.
2. `application-local.yml` 파일 내에 데이터베이스 접속 정보를 정확하게 입력합니다.
3. 터미널에서 다음 명령어를 실행합니다.
    ```bash
    mvn spring-boot:run
    ```

    
## 주요 API
| 엔드포인트 | 역할 | 비고 |
| :--- | :--- | :--- |
| `/api/ai/predict-and-search/*` | **AI 성견 예측 및 유사도 검색 요청 처리** | AI 서버와의 중계 역할 |
| `/auth/*` | 사용자 인증 및 토큰 발급 | 로그인, 회원가입 |
| `/api/lost-pet/*` | 유기동물 분실 신고 및 정보 관리 | |
| `/api/notice/*` | 공지사항 및 문의사항 관리 | |
| `/api/shelter/*` | 보호소 정보 조회 | |
