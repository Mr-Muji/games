// 메인 패키지입니다. 이 파일에서는 서버 실행, 데이터베이스 연결 설정, HTTP 라우터 설정 및 API 핸들러를 구현합니다.
package main

import (
	"database/sql" // SQL 데이터베이스 함수 제공
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"  // CORS 미들웨어 추가
	"github.com/gin-gonic/gin"     // Gin 웹 프레임워크
	"github.com/golang-jwt/jwt/v4" // JWT 처리 함수
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"        // PostgreSQL 드라이버를 초기화합니다.
	"golang.org/x/crypto/bcrypt" // bcrypt 함수를 사용하여 비밀번호 암호화
)

// 사용자 정보를 나타내는 구조체입니다.
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"` // 응답 시 비밀번호는 노출하지 않습니다.
	Score    int    `json:"score"`
}

// JWT Claims 구조체입니다.
type Claims struct {
	ID                   int    `json:"id"`
	Username             string `json:"username"`
	jwt.RegisteredClaims        // 만료시간 등 기본 등록된 클레임을 포함합니다.
}

// 전역 변수로 데이터베이스와 JWT 비밀키를 관리합니다.
var (
	db        *sql.DB
	jwtSecret = []byte("your_jwt_secret") // 기본 JWT 비밀키 (환경변수로 설정할 수 있습니다)
)

// initDB 함수는 PostgreSQL 데이터베이스에 연결을 설정합니다.
func initDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL 환경변수가 설정되지 않았습니다.")
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("DB 연결 실패:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("DB Ping 실패:", err)
	}
	fmt.Println("PostgreSQL 데이터베이스에 연결되었습니다.")

	// 마이그레이션 실행: 테이블이 없으면 생성합니다.
	if err := runMigrations(); err != nil {
		log.Fatal("마이그레이션 실패:", err)
	}
}

// runMigrations 함수는 migrations 폴더에 있는 SQL 파일을 읽어 실행합니다.
func runMigrations() error {
	// 마이그레이션 파일 경로 설정 (예: create_users_table.sql)
	migrationFile := "./migrations/create_users_table.sql"

	// 파일 내용을 읽습니다.
	data, err := os.ReadFile(migrationFile)
	if err != nil {
		return fmt.Errorf("migration 파일 읽기 실패: %v", err)
	}

	// 읽은 SQL 명령문을 실행합니다.
	_, err = db.Exec(string(data))
	if err != nil {
		return fmt.Errorf("migration 실행 실패: %v", err)
	}
	return nil
}

// 점수 저장 요청 구조체
type ScoreRequest struct {
	Score int `json:"score" binding:"required"`
	Lines int `json:"lines"`
	Level int `json:"level"`
}

// 점수 응답 구조체
type ScoreResponse struct {
	Username string `json:"username"`
	Score    int    `json:"score"`
	Lines    int    `json:"lines"`
	Level    int    `json:"level"`
	Date     string `json:"date"`
}

func main() {
	// .env 파일 로드
	err := godotenv.Load()
	if err != nil {
		log.Println(".env 파일을 찾을 수 없습니다:", err)
		// 치명적 오류가 아니므로 계속 진행
	}

	// JWT 시크릿 설정 (환경변수에서 가져오거나, 기본값 사용)
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey != "" {
		jwtSecret = []byte(secretKey)
	}

	// DB 초기화
	initDB()

	// Gin 라우터 생성
	router := gin.Default()

	// CORS 미들웨어 추가 (더 유연한 설정)
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8081", "http://127.0.0.1:8081"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API 경로 설정
	router.POST("/signup", signupHandler)
	router.POST("/login", loginHandler)

	// 기본 루트 경로 추가 (API 상태 확인용)
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "테트리스 게임 API가 실행 중입니다",
		})
	})

	// 인증 필요한 API 그룹 설정 (기존 코드에 있다면 유지)
	authorized := router.Group("/")
	authorized.Use(authMiddleware())
	{
		// 점수 업데이트, 이력 조회 등 인증이 필요한 API는 여기에 추가
		authorized.POST("/scores", updateScoreHandler)
		// 추가 API는 여기에...
	}

	// 서버 포트 설정 및 실행
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 기본 포트
	}

	log.Printf("서버가 http://localhost:%s 에서 실행 중입니다", port)
	router.Run(":" + port)
}

// signupHandler 함수는 회원가입을 처리합니다.
func signupHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	// JSON 요청 데이터를 바인딩합니다.
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "잘못된 요청입니다."})
		return
	}
	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "아이디와 비밀번호를 입력해주세요."})
		return
	}

	// 동일한 사용자가 있는지 확인합니다.
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)", req.Username).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "서버 오류입니다."})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"message": "이미 존재하는 사용자입니다."})
		return
	}

	// 비밀번호를 bcrypt를 사용해 해시 처리합니다.
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "비밀번호 암호화에 실패했습니다."})
		return
	}

	// 사용자 정보를 데이터베이스에 저장합니다. score는 0으로 기본 설정됩니다.
	var user User
	err = db.QueryRow(
		"INSERT INTO users (username, password, score) VALUES ($1, $2, 0) RETURNING id, username, score",
		req.Username, string(hashedPassword),
	).Scan(&user.ID, &user.Username, &user.Score)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "사용자 등록에 실패했습니다."})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// loginHandler 함수는 로그인을 처리합니다.
func loginHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "잘못된 요청입니다."})
		return
	}
	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "아이디와 비밀번호를 입력해주세요."})
		return
	}

	// 데이터베이스에서 사용자를 조회합니다.
	var user User
	err := db.QueryRow("SELECT id, username, password, score FROM users WHERE username=$1", req.Username).
		Scan(&user.ID, &user.Username, &user.Password, &user.Score)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "사용자를 찾을 수 없습니다."})
		return
	}

	// 입력한 비밀번호와 저장된 해시 비밀번호를 비교합니다.
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "비밀번호가 일치하지 않습니다."})
		return
	}

	// JWT 토큰 생성 (유효기간: 1시간)
	expirationTime := time.Now().Add(1 * time.Hour)
	claims := &Claims{
		ID:       user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "토큰 생성에 실패했습니다."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

// authMiddleware 함수는 JWT 기반 인증 미들웨어입니다.
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Authorization 헤더에서 "Bearer {토큰}" 형식의 토큰을 추출합니다.
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "토큰이 제공되지 않았습니다."})
			c.Abort()
			return
		}
		var tokenString string
		fmt.Sscanf(authHeader, "Bearer %s", &tokenString)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "잘못된 인증 형식입니다."})
			c.Abort()
			return
		}
		// JWT 토큰을 파싱하고 검증합니다.
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusForbidden, gin.H{"message": "토큰이 유효하지 않습니다."})
			c.Abort()
			return
		}
		// 토큰의 클레임 정보를 Gin 컨텍스트에 저장합니다.
		if claims, ok := token.Claims.(*Claims); ok {
			c.Set("userID", claims.ID)
			c.Set("username", claims.Username)
		} else {
			c.JSON(http.StatusForbidden, gin.H{"message": "토큰 정보가 올바르지 않습니다."})
			c.Abort()
			return
		}
		c.Next()
	}
}

// getUserHandler 함수는 인증된 사용자의 정보를 반환합니다.
func getUserHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "사용자 정보가 없습니다."})
		return
	}
	var user User
	err := db.QueryRow("SELECT id, username, score FROM users WHERE id=$1", userID).
		Scan(&user.ID, &user.Username, &user.Score)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "사용자를 찾을 수 없습니다."})
		return
	}
	c.JSON(http.StatusOK, user)
}

// updateScoreHandler 함수는 인증된 사용자의 점수를 업데이트합니다.
// 요청 본문에 { "score": 새점수 } 형태로 전달합니다.
func updateScoreHandler(c *gin.Context) {
	// 사용자 ID 가져오기 (JWT에서 추출)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "인증되지 않은 사용자"})
		return
	}

	// 요청 본문 파싱
	var scoreData struct {
		Score int `json:"score"`
	}

	if err := c.ShouldBindJSON(&scoreData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "유효하지 않은 점수 데이터"})
		return
	}

	// 점수 업데이트 로직 (예시)
	_, err := db.Exec("UPDATE users SET score = $1 WHERE id = $2",
		scoreData.Score, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "점수 업데이트 실패"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "점수가 업데이트되었습니다"})
}

// 고득점 목록 조회 핸들러
func getHighScoresHandler(c *gin.Context) {
	// 상위 10개 고득점 목록 가져오기
	rows, err := db.Query(`
		SELECT u.username, u.score, gr.lines, gr.level, gr.played_at 
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
	var highScores []ScoreResponse
	for rows.Next() {
		var score ScoreResponse
		var playedAt time.Time
		if err := rows.Scan(&score.Username, &score.Score, &score.Lines, &score.Level, &playedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "데이터 처리 중 오류가 발생했습니다"})
			return
		}
		score.Date = playedAt.Format("2006-01-02 15:04:05")
		highScores = append(highScores, score)
	}

	c.JSON(http.StatusOK, gin.H{"highScores": highScores})
}

// 사용자 자신의 최고 점수 조회 핸들러
func getUserScoreHandler(c *gin.Context) {
	// JWT 토큰에서 사용자 식별
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "인증이 필요합니다"})
		return
	}

	// 사용자 점수 정보 조회
	var username string
	var score int
	err := db.QueryRow("SELECT username, score FROM users WHERE id = $1", userID).Scan(&username, &score)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "사용자 정보를 불러오는데 실패했습니다"})
		return
	}

	// 최근 게임 기록 조회
	rows, err := db.Query(`
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
	var gameHistory []ScoreResponse
	for rows.Next() {
		var record ScoreResponse
		record.Username = username
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
		"gameHistory": gameHistory,
	})
}
