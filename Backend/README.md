# Animal Shelter API

유기동물 보호소 관리 시스템 백엔드

## 기술 스택
- Spring Boot 3.2.5
- MySQL
- JWT 인증

## 실행 방법

1. `application-example.yml`을 복사해서 `application-local.yml`로 만들기
2. 데이터베이스 정보 입력
3. `mvn spring-boot:run` 실행

## 주요 API
- `/auth/*` - 인증 관련
- `/api/lost-pet/*` - 분실신고 관리
- `/api/notice/*` - 공지사항
- `/api/shelter/*` - 보호소 정보
