# 게임 포털 백엔드 서비스

이 디렉토리는 The Game Portal의 백엔드 서비스를 포함하고 있습니다. Go로 구현되었으며 PostgreSQL 데이터베이스와 연동됩니다.

## 기술 스택

- **언어**: Go 1.23.0+
- **웹 프레임워크**: Gin
- **데이터베이스**: PostgreSQL
- **인증**: JWT (JSON Web Tokens)

## 주요 디렉토리 구조

- `/api`: API 핸들러와 라우트 정의
  - `routes.go`: 라우트 설정
  - `auth.go`: 인증 관련 핸들러
  - `scores.go`: 점수 관련 핸들러
  - `tetris.go`: 테트리스 게임 관련 핸들러
- `/config`: 애플리케이션 설정 관리
- `/db`: 데이터베이스 연결 및 모델 정의
  - `/models`: 데이터베이스 모델 정의
  - `/migrations`: 데이터베이스 스키마 마이그레이션 스크립트
- `/middleware`: HTTP 요청 처리 미들웨어
  - `auth.go`: JWT 인증 미들웨어

## 시작하기

### 환경 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수를 설정하세요:

# PostgreSQL 컨테이너 생성 시 필요한 환경 변수
POSTGRES_USER=mygamesuser       # PostgreSQL 사용자 이름
POSTGRES_PASSWORD=mygamespassword   # PostgreSQL 비밀번호
POSTGRES_DB=gamesdb            # 데이터베이스 이름
# POSTGRES_HOST=postgres         # 호스트명 (Docker Compose에서 서비스 이름)
# POSTGRES_PORT=5432             # PostgreSQL 기본 포트

# 백엔드 애플리케이션 연결 문자열
DATABASE_URL=postgres://mygamesuser:mygamespassword@postgres:5432/gamesdb

### 서버 실행

```bash
go run main.go
```

서버는 기본적으로 8080 포트에서 실행되며, `.env` 파일에서 설정한 포트로 변경 가능합니다.

## API 엔드포인트

### 인증 불필요 API
- `POST /signup`: 사용자 회원가입
- `POST /login`: 사용자 로그인
- `GET /tetris/leaderboard`: 테트리스 게임 리더보드 조회

### 인증 필요 API
- `GET /user`: 현재 로그인한 사용자 정보 조회
- `POST /tetris/score`: 테트리스 게임 점수 업데이트
- `GET /tetris/user/score`: 사용자의 테트리스 점수 조회
- `POST /scores`: 게임 점수 업데이트 (레거시 지원)
- `GET /user/scores`: 사용자 게임 점수 조회 (레거시 지원)

## 데이터베이스 마이그레이션

서버 시작 시 자동으로 필요한 테이블을 생성합니다:
- users 테이블: 사용자 정보 저장
- game_records 테이블: 일반 게임 기록 저장
- tetris_scores 테이블: 테트리스 게임 점수 저장
