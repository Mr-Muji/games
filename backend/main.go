// 메인 패키지입니다. 이 파일에서는 서버 실행, 데이터베이스 연결 설정, HTTP 라우터 설정을 담당합니다.
package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"games/backend/api"    // API 핸들러
	"games/backend/config" // 설정
	"games/backend/db"     // 데이터베이스
	// 미들웨어
)

func main() {
	// .env 파일 로드
	err := godotenv.Load()
	if err != nil {
		log.Println(".env 파일을 찾을 수 없습니다:", err)
		// 치명적 오류가 아니므로 계속 진행
	}

	// 설정 초기화
	config.InitConfig()

	// DB 초기화
	db.InitDB()

	// Gin 라우터 생성
	router := gin.Default()

	// CORS 미들웨어 추가 (개발 및 프로덕션 환경 모두 지원)
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			// 로컬 개발 환경 포트들
			"http://localhost:3000", "http://127.0.0.1:3000",
			"http://localhost:8000", "http://127.0.0.1:8000",
			"http://localhost:5500", "http://127.0.0.1:5500",
			"http://localhost:8080", "http://127.0.0.1:8080",
			"http://localhost:8081", "http://127.0.0.1:8081",
			"http://localhost:4000", "http://127.0.0.1:4000",
			"http://localhost", "http://127.0.0.1",

			// 프로덕션 도메인
			"https://kakaotech.my", "https://www.kakaotech.my",
			"http://kakaotech.my", "http://www.kakaotech.my",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API 라우트 설정
	api.SetupRoutes(router)

	// 기본 루트 경로 추가 (API 상태 확인용)
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "게임 플랫폼 API가 실행 중입니다",
		})
	})

	// 서버 포트 설정 및 실행
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 기본 포트
	}

	log.Printf("서버가 http://localhost:%s 에서 실행 중입니다", port)
	router.Run(":" + port)
}
