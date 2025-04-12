-- 테트리스 최고 점수 테이블 생성 (사용자당 하나의 최고 점수만 저장)
CREATE TABLE IF NOT EXISTS tetris_scores (
    user_id INTEGER PRIMARY KEY,  -- 사용자 ID (각 사용자당 하나의 기록만 저장)
    score INTEGER NOT NULL DEFAULT 0,
    lines INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 점수 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_tetris_scores_score ON tetris_scores(score DESC); 