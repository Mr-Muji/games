// api 패키지는 API 핸들러를 정의합니다.
package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"games/backend/db"
	"games/backend/db/models"
)

// UpdateScoreHandler 함수는 점수를 업데이트합니다.
func UpdateScoreHandler(c *gin.Context) {
	// 사용자 ID 가져오기 (JWT에서 추출)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "인증되지 않은 사용자"})
		return
	}

	// 점수 데이터 바인딩
	var req models.ScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "유효하지 않은 점수 데이터"})
		return
	}

	// 현재 사용자의 최고 점수 가져오기
	var currentScore int
	err := db.DB.QueryRow("SELECT score FROM users WHERE id = $1", userID).Scan(&currentScore)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "사용자 점수 조회 실패"})
		return
	}

	// 게임 기록 저장
	_, err = db.DB.Exec(
		"INSERT INTO game_records (user_id, score, lines, level, played_at) VALUES ($1, $2, $3, $4, $5)",
		userID, req.Score, req.Lines, req.Level, time.Now(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "게임 기록 저장 실패"})
		return
	}

	// 최고 점수 갱신 여부 확인 및 업데이트
	isNewHighScore := false
	if req.Score > currentScore {
		_, err = db.DB.Exec("UPDATE users SET score = $1 WHERE id = $2", req.Score, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "점수 업데이트 실패"})
			return
		}
		isNewHighScore = true
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "점수가 저장되었습니다",
		"newHighScore": isNewHighScore,
	})
}

// GetHighScoresHandler 함수는 상위 점수 목록을 반환합니다.
func GetHighScoresHandler(c *gin.Context) {
	// 상위 10개 고득점 목록 가져오기
	rows, err := db.DB.Query(`
		SELECT u.username, u.nickname, u.score, gr.lines, gr.level, gr.played_at 
		FROM users u
		JOIN game_records gr ON u.id = gr.user_id
		ORDER BY u.score DESC
		LIMIT 10
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "고득점 목록을 불러오는데 실패했습니다"})
		return
	}
	defer rows.Close()

	// 결과 조합
	var highScores []models.ScoreResponse
	for rows.Next() {
		var score models.ScoreResponse
		var playedAt time.Time
		if err := rows.Scan(&score.Username, &score.Nickname, &score.Score, &score.Lines, &score.Level, &playedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "데이터 처리 중 오류가 발생했습니다"})
			return
		}
		score.Date = playedAt.Format("2006-01-02 15:04:05")
		highScores = append(highScores, score)
	}

	c.JSON(http.StatusOK, gin.H{"highScores": highScores})
}

// GetUserScoreHandler 함수는 현재 사용자의 점수 정보를 반환합니다.
func GetUserScoreHandler(c *gin.Context) {
	// JWT 토큰에서 사용자 식별
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "인증이 필요합니다"})
		return
	}

	// 사용자 점수 정보 조회
	var username string
	var nickname string
	var score int
	err := db.DB.QueryRow("SELECT username, nickname, score FROM users WHERE id = $1", userID).Scan(&username, &nickname, &score)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "사용자 정보를 불러오는데 실패했습니다"})
		return
	}

	// 최근 게임 기록 조회
	rows, err := db.DB.Query(`
		SELECT score, lines, level, played_at 
		FROM game_records 
		WHERE user_id = $1 
		ORDER BY played_at DESC
		LIMIT 5
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "게임 기록을 불러오는데 실패했습니다"})
		return
	}
	defer rows.Close()

	// 결과 조합
	var gameHistory []models.ScoreResponse
	for rows.Next() {
		var record models.ScoreResponse
		record.Username = username
		record.Nickname = nickname
		var playedAt time.Time
		if err := rows.Scan(&record.Score, &record.Lines, &record.Level, &playedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "데이터 처리 중 오류가 발생했습니다"})
			return
		}
		record.Date = playedAt.Format("2006-01-02 15:04:05")
		gameHistory = append(gameHistory, record)
	}

	c.JSON(http.StatusOK, gin.H{
		"highScore":   score,
		"username":    username,
		"nickname":    nickname,
		"gameHistory": gameHistory,
	})
}
