-- 게임 기록을 저장하는 테이블이 존재하지 않으면 생성합니다.
CREATE TABLE IF NOT EXISTS game_records (
    id SERIAL PRIMARY KEY,             -- 고유 ID
    user_id INTEGER REFERENCES users(id), -- 사용자 ID (foreign key)
    score INTEGER NOT NULL,            -- 게임 점수
    lines INTEGER NOT NULL DEFAULT 0,  -- 제거한 라인 수
    level INTEGER NOT NULL DEFAULT 1,  -- 도달한 레벨
    played_at TIMESTAMP NOT NULL       -- 게임 플레이 시간
);

-- 점수 조회를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_game_records_score ON game_records(score DESC); 