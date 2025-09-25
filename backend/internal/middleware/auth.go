package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// JWT密钥 - 生产环境中应该从环境变量获取
var jwtSecret = []byte("project-management-secret-key-2024")

// Claims JWT载荷结构
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

// GenerateToken 生成JWT token
func GenerateToken(userID, email, name string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Name:   name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // 24小时过期
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "project-management-system",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateToken 验证JWT token
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// AuthMiddleware JWT认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查Authorization头
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "请提供有效的身份认证信息",
				"code":    "AUTH_TOKEN_MISSING",
			})
			c.Abort()
			return
		}

		// 解析Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "无效的认证格式，请使用Bearer token",
				"code":    "AUTH_FORMAT_INVALID",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 验证token
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "无效或过期的认证token",
				"code":    "AUTH_TOKEN_INVALID",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// 将用户信息存储到上下文中
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_name", claims.Name)

		c.Next()
	}
}

// OptionalAuthMiddleware 可选认证中间件（对于某些需要兼容的路由）
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				claims, err := ValidateToken(parts[1])
				if err == nil {
					c.Set("user_id", claims.UserID)
					c.Set("user_email", claims.Email)
					c.Set("user_name", claims.Name)
				}
			}
		}
		c.Next()
	}
}

// GetCurrentUser 从上下文中获取当前用户信息
func GetCurrentUser(c *gin.Context) (userID, email, name string, exists bool) {
	userIDInterface, exists1 := c.Get("user_id")
	emailInterface, exists2 := c.Get("user_email")
	nameInterface, exists3 := c.Get("user_name")

	if !exists1 || !exists2 || !exists3 {
		return "", "", "", false
	}

	userID, ok1 := userIDInterface.(string)
	email, ok2 := emailInterface.(string)
	name, ok3 := nameInterface.(string)

	if !ok1 || !ok2 || !ok3 {
		return "", "", "", false
	}

	return userID, email, name, true
}

// RequireRole 角色权限中间件（预留扩展）
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 这里可以根据需要实现基于角色的权限控制
		// 目前先通过，后续可以扩展
		c.Next()
	}
}
