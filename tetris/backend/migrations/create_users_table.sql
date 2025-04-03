-- users 테이블이 존재하지 않으면 생성합니다.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,         -- 고유 ID
    username VARCHAR(50) UNIQUE NOT NULL,  -- 유저 아이디 (유일)
    password VARCHAR(255) NOT NULL, -- 암호화된 비밀번호
    score INTEGER DEFAULT 0         -- 초기 점수
); 