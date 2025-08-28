package api

import (
	"database/sql"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()

	// 配置CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"}
	config.ExposeHeaders = []string{"Content-Length"}
	config.AllowCredentials = true
	router.Use(cors.New(config))

	// 创建处理器
	handler := NewHandler(db)

	// API路由组
	api := router.Group("/api")
	{
		// 项目相关路由
		api.GET("/projects", handler.GetProjects)
		api.POST("/projects", handler.CreateProject)
		api.PATCH("/projects/:projectId", handler.UpdateProject)
		api.DELETE("/projects/:projectId", handler.DeleteProject)

		// OKR相关路由
		api.GET("/okr-sets", handler.GetOkrSets)
		api.POST("/okr-sets", handler.CreateOkrSet)
		api.PUT("/okr-sets/:periodId", handler.UpdateOkrSet)

		// 用户相关路由
		api.GET("/users", handler.GetUsers)
		api.POST("/refresh-users", handler.RefreshUsers)
		
		// 认证相关路由
		api.GET("/check-auth", handler.CheckAuth)
		api.POST("/oidc-token", handler.OIDCTokenExchange)

		// 周会相关路由
		api.POST("/perform-weekly-rollover", handler.PerformWeeklyRollover)

		// 数据迁移路由（一次性使用）
		api.POST("/migrate-initial-data", handler.MigrateInitialData)
	}

	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	return router
}
