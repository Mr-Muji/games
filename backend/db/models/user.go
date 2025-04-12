// models 패키지는 데이터 모델을 정의합니다.
package models

import (
	"github.com/golang-jwt/jwt/v4"
)

// User 사용자 정보를 나타내는 구조체입니다.
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Nickname string `json:"nickname"`
	Password string `json:"-"` // 응답 시 비밀번호는 노출하지 않습니다.
}

// Claims JWT Claims 구조체입니다.
type Claims struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Nickname string `json:"nickname"`
	jwt.RegisteredClaims
}
