// api 패키지는 API 핸들러와 라우트를 정의합니다.
package api

import (
	"github.com/gin-gonic/gin"

	"games/backend/middleware"
)

// SetupRoutes 함수는 애플리케이션 API 라우트를 설정합니다.
func SetupRoutes(router *gin.Engine) {
	// 인증 불필요 API
	router.POST("/signup", SignupHandler)
	router.POST("/login", LoginHandler)

	// 테트리스 랭킹 조회는 인증 없이 가능하게 설정
	router.GET("/tetris/leaderboard", GetTetrisLeaderboardHandler)

	// 인증 필요 API 그룹
	auth := router.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		// 사용자 관련 API
		auth.GET("/user", GetUserHandler)

		// 테트리스 관련 API
		auth.POST("/tetris/score", UpdateTetrisScoreHandler)
		auth.GET("/tetris/user/score", GetUserTetrisScoreHandler)

		// 기존 점수 API (이전 버전 호환성을 위해 유지)
		auth.POST("/scores", UpdateScoreHandler)
		auth.GET("/user/scores", GetUserScoreHandler)
	}
}

// GetUserHandler 함수는 현재 로그인한 사용자 정보를 반환합니다.
func GetUserHandler(c *gin.Context) {
	userID := c.MustGet("userID").(int)
	username := c.MustGet("username").(string)
	nickname := c.MustGet("nickname").(string)

	c.JSON(200, gin.H{
		"id":       userID,
		"username": username,
		"nickname": nickname,
	})
}
