package main

import (
	"log"
	"project-management-backend/internal/api"
	"project-management-backend/internal/config"
	"project-management-backend/internal/database"
	"project-management-backend/internal/scheduler"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// 启动定时任务
	scheduler.Start(db)

	// 启动 API 服务器
	router := api.SetupRouter(db)
	log.Printf("Server starting on port %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
