// config 패키지는 애플리케이션 설정을 관리합니다.
package config

import (
	"os"
)

var (
	// JWTSecret JWT 서명에 사용할 비밀키
	JWTSecret []byte
)

// InitConfig 함수는 애플리케이션 설정을 초기화합니다.
func InitConfig() {
	// JWT 시크릿 설정 (환경변수에서 가져오거나, 기본값 사용)
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey != "" {
		JWTSecret = []byte(secretKey)
	} else {
		// 기본 비밀키 (실제 환경에서는 안전한 값으로 설정해야 함)
		JWTSecret = []byte("your_jwt_secret")
	}
}
