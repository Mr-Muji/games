// api 패키지는 API 핸들러를 정의합니다.
package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"

	"games/backend/config"
	"games/backend/db"
	"games/backend/db/models"
)

// SignupHandler 함수는 회원가입을 처리합니다.
func SignupHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Nickname string `json:"nickname"`
		Password string `json:"password"`
	}

	// JSON 요청 데이터를 바인딩합니다.
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "잘못된 요청입니다."})
		return
	}

	// 필수 필드 검증 (비어있는지만 확인)
	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "아이디와 비밀번호를 입력해주세요."})
		return
	}

	if req.Nickname == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "닉네임은 필수 입력 항목입니다."})
		return
	}

	// 동일한 사용자명이 있는지 확인합니다.
	var exists bool
	err := db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)", req.Username).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "서버 오류입니다."})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"message": "이미 존재하는 아이디입니다."})
		return
	}

	// 닉네임 중복 확인 추가
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE nickname=$1)", req.Nickname).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "서버 오류입니다."})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"message": "이미 사용 중인 닉네임입니다."})
		return
	}

	// 비밀번호를 bcrypt를 사용해 해시 처리합니다.
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "비밀번호 암호화에 실패했습니다."})
		return
	}

	// 사용자 정보를 데이터베이스에 저장합니다. score 필드 제거
	var user models.User
	err = db.DB.QueryRow(
		"INSERT INTO users (username, nickname, password) VALUES ($1, $2, $3) RETURNING id, username, nickname",
		req.Username, req.Nickname, string(hashedPassword),
	).Scan(&user.ID, &user.Username, &user.Nickname)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "사용자 등록에 실패했습니다."})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// LoginHandler 함수는 로그인을 처리합니다.
func LoginHandler(c *gin.Context) {
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

	// 데이터베이스에서 사용자를 조회합니다. score 필드 제거
	var user models.User
	err := db.DB.QueryRow("SELECT id, username, nickname, password FROM users WHERE username=$1", req.Username).
		Scan(&user.ID, &user.Username, &user.Nickname, &user.Password)
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
	claims := &models.Claims{
		ID:       user.ID,
		Username: user.Username,
		Nickname: user.Nickname,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(config.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "토큰 생성에 실패했습니다."})
		return
	}

	// 토큰과 닉네임 함께 반환
	c.JSON(http.StatusOK, gin.H{
		"token":    tokenString,
		"nickname": user.Nickname,
		"username": user.Username,
	})
}
