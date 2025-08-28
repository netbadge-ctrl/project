package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func Initialize(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// 创建数据表
	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return db, nil
}

func createTables(db *sql.DB) error {
	// 创建用户表
	usersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id VARCHAR(255) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255),
		avatar_url VARCHAR(255)
	);`

	// 创建OKR集合表
	okrSetsTable := `
	CREATE TABLE IF NOT EXISTS okr_sets (
		period_id VARCHAR(255) PRIMARY KEY,
		period_name VARCHAR(255) NOT NULL,
		okrs JSONB NOT NULL
	);`

	// 创建项目表
	projectsTable := `
	CREATE TABLE IF NOT EXISTS projects (
		id VARCHAR(255) PRIMARY KEY,
		name TEXT NOT NULL,
		priority VARCHAR(50) NOT NULL,
		business_problem TEXT,
		key_result_ids TEXT[],
		weekly_update TEXT,
		last_week_update TEXT,
		status VARCHAR(50) NOT NULL,
		product_managers JSONB,
		backend_developers JSONB,
		frontend_developers JSONB,
		qa_testers JSONB,
		proposal_date DATE NULL,
		launch_date DATE NULL,
		followers TEXT[],
		comments JSONB,
		change_log JSONB
	);`

	tables := []string{usersTable, okrSetsTable, projectsTable}

	for _, table := range tables {
		if _, err := db.Exec(table); err != nil {
			return fmt.Errorf("failed to create table: %w", err)
		}
	}

	return nil
}
