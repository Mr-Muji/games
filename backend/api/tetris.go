package api

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"games/backend/db"
	"games/backend/db/models"
)

// UpdateTetrisScoreHandler 테트리스 최고 점수를 업데이트합니다.
func UpdateTetrisScoreHandler(c *gin.Context) {
	// 사용자 ID 가져오기 (JWT에서 추출)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "인증되지 않은 사용자"})
		return
	}

	// 점수 데이터 바인딩
	var req models.TetrisScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "유효하지 않은 점수 데이터"})
		return
	}

	// 현재 최고 점수 조회
	var currentScore int
	var hasRecord bool // exists 대신 다른 변수명 사용
	err := db.DB.QueryRow(
		`SELECT score, TRUE FROM tetris_scores WHERE user_id = $1`,
		userID,
	).Scan(&currentScore, &hasRecord)

	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "최고 점수 조회 실패"})
		return
	}

	// 새 점수가 더 높은지 확인
	isNewHighScore := false
	if err == sql.ErrNoRows || req.Score > currentScore {
		isNewHighScore = true
	} else {
		// 최고 점수가 아니면 저장하지 않고 바로 응답
		c.JSON(http.StatusOK, gin.H{
			"message":          "기존 최고 점수가 더 높습니다",
			"currentHighScore": currentScore,
			"isNewHighScore":   false,
		})
		return
	}

	// 최고 점수인 경우에만 DB 업데이트
	if isNewHighScore {
		now := time.Now()

		if err == sql.ErrNoRows {
			// 첫 기록인 경우 INSERT
			_, err = db.DB.Exec(
				`INSERT INTO tetris_scores 
				(user_id, score, lines, level, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6)`,
				userID, req.Score, req.Lines, req.Level, now, now,
			)
		} else {
			// 기존 기록이 있는 경우 UPDATE
			_, err = db.DB.Exec(
				`UPDATE tetris_scores 
				SET score = $1, lines = $2, level = $3, updated_at = $4
				WHERE user_id = $5`,
				req.Score, req.Lines, req.Level, now, userID,
			)
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "점수 업데이트 실패"})
			return
		}
	}

	// 랭킹 정보 조회 (현재 사용자의 순위)
	var rank int
	err = db.DB.QueryRow(
		`SELECT COUNT(*) + 1 
		FROM tetris_scores
		WHERE score > $1`,
		req.Score,
	).Scan(&rank)

	if err != nil {
		rank = 0 // 순위 조회 실패 시 0으로 설정
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "점수가 업데이트되었습니다",
		"isNewHighScore": isNewHighScore,
		"rank":           rank,
	})
}

// GetTetrisLeaderboardHandler 테트리스 리더보드(랭킹) 정보를 조회합니다.
func GetTetrisLeaderboardHandler(c *gin.Context) {
	// 페이지네이션 파라미터
	limit := 10
	offset := 0

	// 쿼리 파라미터 읽기
	if limitParam := c.Query("limit"); limitParam != "" {
		if val, err := strconv.Atoi(limitParam); err == nil && val > 0 {
			limit = val
		}
	}

	if offsetParam := c.Query("offset"); offsetParam != "" {
		if val, err := strconv.Atoi(offsetParam); err == nil && val >= 0 {
			offset = val
		}
	}

	// 리더보드 쿼리
	rows, err := db.DB.Query(
		`SELECT 
			ts.user_id, 
			u.username, 
			u.nickname, 
			ts.score, 
			ts.lines, 
			ts.level, 
			ts.created_at,
			ts.updated_at
		FROM tetris_scores ts
		JOIN users u ON ts.user_id = u.id
		ORDER BY ts.score DESC
		LIMIT $1 OFFSET $2`,
		limit, offset,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "리더보드 조회 실패"})
		return
	}
	defer rows.Close()

	// 결과 조합
	var leaderboard []models.TetrisScore
	rank := offset + 1 // 시작 순위 계산

	for rows.Next() {
		var score models.TetrisScore
		if err := rows.Scan(
			&score.UserID,
			&score.Username,
			&score.Nickname,
			&score.Score,
			&score.Lines,
			&score.Level,
			&score.CreatedAt,
			&score.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "데이터 처리 중 오류 발생"})
			return
		}

		leaderboard = append(leaderboard, score)
		rank++
	}

	// 전체 레코드 수 조회 (페이지네이션 정보용)
	var total int
	err = db.DB.QueryRow("SELECT COUNT(*) FROM tetris_scores").Scan(&total)
	if err != nil {
		total = 0 // 오류 시 0으로 설정
	}

	c.JSON(http.StatusOK, gin.H{
		"leaderboard": leaderboard,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

// GetUserTetrisScoreHandler 특정 사용자의 테트리스 최고 점수를 조회합니다.
func GetUserTetrisScoreHandler(c *gin.Context) {
	// JWT 토큰에서 사용자 식별
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "인증이 필요합니다"})
		return
	}

	// 사용자 정보 조회
	var username, nickname string
	err := db.DB.QueryRow(
		"SELECT username, nickname FROM users WHERE id = $1",
		userID,
	).Scan(&username, &nickname)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "사용자 정보 조회 실패"})
		return
	}

	// 사용자의 테트리스 최고 점수 조회
	var score models.TetrisScore
	score.UserID = userID.(int)
	score.Username = username
	score.Nickname = nickname

	err = db.DB.QueryRow(
		`SELECT score, lines, level, created_at, updated_at
		FROM tetris_scores 
		WHERE user_id = $1`,
		userID,
	).Scan(
		&score.Score,
		&score.Lines,
		&score.Level,
		&score.CreatedAt,
		&score.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// 기록이 없는 경우
			c.JSON(http.StatusOK, gin.H{
				"username":  username,
				"nickname":  nickname,
				"highScore": 0,
				"hasRecord": false,
				"rank":      0,
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"message": "점수 조회 실패"})
		return
	}

	// 사용자 랭킹 조회
	var rank int
	err = db.DB.QueryRow(
		`SELECT COUNT(*) + 1 
		FROM tetris_scores 
		WHERE score > $1`,
		score.Score,
	).Scan(&rank)

	if err != nil {
		rank = 0 // 오류 시 0으로 설정
	}

	c.JSON(http.StatusOK, gin.H{
		"username":  username,
		"nickname":  nickname,
		"highScore": score.Score,
		"lines":     score.Lines,
		"level":     score.Level,
		"hasRecord": true,
		"rank":      rank,
	})
}
