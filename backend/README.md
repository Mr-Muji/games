# PostgreSQL 컨테이너 생성 시 필요한 환경 변수
POSTGRES_USER=mygamesuser       # PostgreSQL 사용자 이름
POSTGRES_PASSWORD=mygamespassword   # PostgreSQL 비밀번호
POSTGRES_DB=gamesdb            # 데이터베이스 이름
# POSTGRES_HOST=postgres         # 호스트명 (Docker Compose에서 서비스 이름)
# POSTGRES_PORT=5432             # PostgreSQL 기본 포트

# 백엔드 애플리케이션 연결 문자열
DATABASE_URL=postgres://mygamesuser:mygamespassword@postgres:5432/gamesdb