// models 패키지는 데이터 모델을 정의합니다.
package models

// ScoreRequest 점수 저장 요청 구조체
type ScoreRequest struct {
	Score int `json:"score" binding:"required"`
	Lines int `json:"lines"`
	Level int `json:"level"`
}

// ScoreResponse 점수 응답 구조체
type ScoreResponse struct {
	Username string `json:"username"`
	Nickname string `json:"nickname"`
	Score    int    `json:"score"`
	Lines    int    `json:"lines"`
	Level    int    `json:"level"`
	Date     string `json:"date"`
}
