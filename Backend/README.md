# 함께찾개 백엔드

Spring Boot REST API입니다. 사용자 인증, 유기동물 정보 조회, 실종 신고, 공지와 문의, 보호소 조회를 처리합니다. 이미지 검색 요청은 [Flask AI 서비스](../AI/README.md)에 전달하고, AI가 반환한 동물 ID를 MySQL의 상세 정보와 연결합니다.

## 기술 스택

- Java 17, Maven, Spring Boot 3.2.5
- Spring Web, Spring Data JPA, MySQL
- Spring Security 및 JWT 인증
- RestTemplate 기반 AI 서버 연동

## 로컬 실행

1. Java 17, Maven과 MySQL을 준비합니다.
2. [application-example.yml](src/main/resources/application-example.yml)을 같은 디렉터리의 `application-local.yml`로 복사합니다.
3. 로컬 설정에 아래 값을 채웁니다. 실제 접속 정보와 키는 로컬에 보관합니다.

| 설정 | 용도 |
| --- | --- |
| `spring.datasource.url`, `username`, `password` | MySQL 연결 |
| `jwt.secret` | JWT 서명 |
| `app.upload-root` | 실종 신고 이미지 저장 경로 |
| `openapi.shelter.url`, `openapi.shelter.service-key` | 보호소 조회에 사용하는 외부 API |
| `ai.base-url` | AI 서버 주소. 로컬에서 [AI 앱](../AI/app.py)을 실행하는 경우 `http://localhost:5000` |

저장소 루트에서 아래 명령으로 `local` 프로필을 활성화합니다.

```bash
cd Backend
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

기본 서버 포트는 `8080`입니다. 유사견 상세 정보까지 조회하려면 AI 검색 인덱스의 동물 ID에 대응하는 데이터가 MySQL에 있어야 합니다.

## 주요 API

| 경로 | 역할 |
| --- | --- |
| `POST /api/search/image` | 업로드 사진을 AI 서버의 `/search/uploaded`로 전달 |
| `POST /api/search/generated` | AI 서버의 `/search/generated`로 전달해 성견 예상 이미지 생성 및 검색 |
| `/auth/*` | 회원가입, 로그인, 토큰 갱신 및 로그아웃 |
| `/api/dog-details` | 유기동물 목록, 상세 정보, 품종 조회 |
| `/api/lost-pet` | 실종 신고와 신고 이미지 |
| `/api/notices`, `/api/inquiries` | 공지사항, 문의 및 문의 답변 |
| `/api/shelters` | 외부 보호소 정보 조회와 필터링 |
| `/api/mypage`, `/api/admin/users` | 내 정보와 사용자 관리 |

이미지 검색 API는 `multipart/form-data`의 `image` 필드를 받습니다. 이미지 검색과 일부 조회는 공개 경로이며, 쓰기 작업과 사용자·관리자 기능에는 경로별 인증 및 권한 규칙이 적용됩니다.

## 코드 위치

- [컨트롤러](src/main/java/com/example/animal/controller/)에서 요청 경로와 입력 형식을 정의합니다.
- [서비스](src/main/java/com/example/animal/service/)에서 AI 요청 중계, 보호소 조회, 이미지 저장과 업무 로직을 처리합니다.
- [리포지토리](src/main/java/com/example/animal/repository/)에서 Spring Data JPA로 데이터를 조회합니다.
