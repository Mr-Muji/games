package models

import (
	"time"
)

// TetrisScore 테트리스 게임 최고 점수 정보를 나타내는 구조체입니다.
type TetrisScore struct {
	UserID    int       `json:"user_id"`
	Username  string    `json:"username,omitempty"` // 조회 시 사용
	Nickname  string    `json:"nickname,omitempty"` // 조회 시 사용
	Score     int       `json:"score"`
	Lines     int       `json:"lines"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TetrisScoreRequest 테트리스 점수 저장 요청 구조체
type TetrisScoreRequest struct {
	Score int `json:"score" binding:"required"`
	Lines int `json:"lines"`
	Level int `json:"level"`
}
