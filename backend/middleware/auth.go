// middleware 패키지는 HTTP 요청 처리를 위한 미들웨어를 정의합니다.
package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"

	"games/backend/config"
	"games/backend/db/models"
)

// AuthMiddleware JWT 기반 인증 미들웨어입니다.
func AuthMiddleware() gin.HandlerFunc {
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
		token, err := jwt.ParseWithClaims(tokenString, &models.Claims{}, func(token *jwt.Token) (interface{}, error) {
			return config.JWTSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusForbidden, gin.H{"message": "토큰이 유효하지 않습니다."})
			c.Abort()
			return
		}

		// 토큰의 클레임 정보를 Gin 컨텍스트에 저장합니다.
		if claims, ok := token.Claims.(*models.Claims); ok {
			c.Set("userID", claims.ID)
			c.Set("username", claims.Username)
			c.Set("nickname", claims.Nickname)
		} else {
			c.JSON(http.StatusForbidden, gin.H{"message": "토큰 정보가 올바르지 않습니다."})
			c.Abort()
			return
		}

		c.Next()
	}
}
