package api

import (
	"encoding/json"
	"net/http"
	"project-management-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

// 辅助函数：将字符串转换为字符串指针
func stringPtr(s string) *string {
	return &s
}

// MigrateInitialData 迁移初始数据
func (h *Handler) MigrateInitialData(c *gin.Context) {
	// 清空现有数据
	if err := h.clearTables(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear tables: " + err.Error()})
		return
	}

	// 迁移用户数据
	if err := h.migrateUsers(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to migrate users: " + err.Error()})
		return
	}

	// 迁移OKR数据
	if err := h.migrateOkrSets(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to migrate OKR sets: " + err.Error()})
		return
	}

	// 迁移项目数据
	if err := h.migrateProjects(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to migrate projects: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Initial data migration completed successfully"})
}

func (h *Handler) clearTables() error {
	tables := []string{"projects", "okr_sets", "users"}
	for _, table := range tables {
		_, err := h.db.Exec("DELETE FROM " + table)
		if err != nil {
			return err
		}
	}
	return nil
}

func (h *Handler) migrateUsers() error {
	users := []models.User{
		{ID: "20416", Name: "陈雨", Email: "chenyu6@kingsoft.com", AvatarURL: "https://picsum.photos/seed/20416/40/40"},
		{ID: "21614", Name: "李明", Email: "liming@kingsoft.com", AvatarURL: "https://picsum.photos/seed/21614/40/40"},
		{ID: "25408", Name: "王芳", Email: "wangfang@kingsoft.com", AvatarURL: "https://picsum.photos/seed/25408/40/40"},
		{ID: "24533", Name: "张伟", Email: "zhangwei@kingsoft.com", AvatarURL: "https://picsum.photos/seed/24533/40/40"},
		{ID: "14670", Name: "刘洋", Email: "liuyang@kingsoft.com", AvatarURL: "https://picsum.photos/seed/14670/40/40"},
		{ID: "22231", Name: "赵敏", Email: "zhaomin@kingsoft.com", AvatarURL: "https://picsum.photos/seed/22231/40/40"},
		{ID: "10001", Name: "陈楠", Email: "chennan@kingsoft.com", AvatarURL: "https://picsum.photos/seed/10001/40/40"},
	}

	for _, user := range users {
		_, err := h.db.Exec(
			"INSERT INTO users (id, name, email, avatar_url) VALUES ($1, $2, $3, $4)",
			user.ID, user.Name, user.Email, user.AvatarURL)
		if err != nil {
			return err
		}
	}
	return nil
}

func (h *Handler) migrateOkrSets() error {
	okrSets := []models.OkrSet{
		{
			PeriodID:   "2025-H2",
			PeriodName: "2025下半年",
			Okrs: []models.OKR{
				{
					ID:        "okr1",
					Objective: "实现季度新用户增长30%，提升品牌市场占有率",
					KeyResults: []models.KeyResult{
						{ID: "kr1_1", Description: "完成3次线上市场推广活动"},
						{ID: "kr1_2", Description: "应用商店评分提升至4.8分"},
					},
				},
				{
					ID:        "okr2",
					Objective: "优化产品核心功能，提升用户体验满意度至90%",
					KeyResults: []models.KeyResult{
						{ID: "kr2_1", Description: "完成用户界面重构"},
						{ID: "kr2_2", Description: "实现响应时间优化至2秒内"},
					},
				},
			},
		},
	}

	for _, okrSet := range okrSets {
		okrsJSON, _ := json.Marshal(okrSet.Okrs)
		_, err := h.db.Exec(
			"INSERT INTO okr_sets (period_id, period_name, okrs) VALUES ($1, $2, $3)",
			okrSet.PeriodID, okrSet.PeriodName, okrsJSON)
		if err != nil {
			return err
		}
	}
	return nil
}

func (h *Handler) migrateProjects() error {
	// 预定义字符串变量
	businessProblem1 := "新用户注册率增长放缓，需要提升品牌曝光度和转化率。"
	weeklyUpdate1 := "市场活动已启动，网红合作细节敲定中。"
	lastWeekUpdate1 := "<div>确定了市场推广的核心主题和预算。</div>"
	proposalDate1 := "2024-05-01"
	launchDate1 := "2024-09-01"
	
	businessProblem2 := "移动端应用启动时间过长，用户体验不佳。"
	weeklyUpdate2 := "完成了首屏加载优化，正在进行内存管理优化。"
	lastWeekUpdate2 := "分析了性能瓶颈，制定了优化方案。"
	proposalDate2 := "2024-06-01"
	launchDate2 := "2024-08-30"

	projects := []models.Project{
		{
			ID:              "p1",
			Name:            "Q3 用户增长计划",
			Priority:        "部门OKR相关",
			BusinessProblem: &businessProblem1,
			KeyResultIds:    []string{"kr1_1", "kr1_2"},
			WeeklyUpdate:    &weeklyUpdate1,
			LastWeekUpdate:  &lastWeekUpdate1,
			Status:          "开发中",
			ProductManagers: []models.TeamMember{
				{UserID: "20416", StartDate: "2024-06-01", EndDate: "2024-09-01"},
			},
			BackendDevelopers: []models.TeamMember{
				{UserID: "21614", StartDate: "2024-07-01", EndDate: "2024-08-15"},
			},
			FrontendDevelopers: []models.TeamMember{
				{UserID: "25408", StartDate: "2024-07-01", EndDate: "2024-08-20"},
			},
			QaTesters: []models.TeamMember{
				{UserID: "24533", StartDate: "2024-08-01", EndDate: "2024-09-01"},
			},
			ProposalDate: &proposalDate1,
			LaunchDate:   &launchDate1,
			Followers:    []string{"14670", "22231"},
			Comments:     []models.Comment{},
			ChangeLog:    []models.ChangeLogEntry{},
		},
		{
			ID:              "p2",
			Name:            "移动端性能优化",
			Priority:        "部门OKR相关",
			BusinessProblem: &businessProblem2,
			KeyResultIds:    []string{"kr2_1", "kr2_2"},
			WeeklyUpdate:    &weeklyUpdate2,
			LastWeekUpdate:  &lastWeekUpdate2,
			Status:          "开发中",
			ProductManagers: []models.TeamMember{
				{UserID: "20416", StartDate: "2024-06-15", EndDate: "2024-08-30"},
			},
			BackendDevelopers: []models.TeamMember{
				{UserID: "21614", StartDate: "2024-07-01", EndDate: "2024-08-15"},
			},
			FrontendDevelopers: []models.TeamMember{
				{UserID: "25408", StartDate: "2024-07-01", EndDate: "2024-08-30"},
			},
			QaTesters: []models.TeamMember{
				{UserID: "24533", StartDate: "2024-08-01", EndDate: "2024-08-30"},
			},
			ProposalDate: &proposalDate2,
			LaunchDate:   &launchDate2,
			Followers:    []string{"22231"},
			Comments:     []models.Comment{},
			ChangeLog:    []models.ChangeLogEntry{},
		},
	}

	for _, project := range projects {
		// 序列化JSONB字段
		productManagersJSON, _ := json.Marshal(project.ProductManagers)
		backendDevelopersJSON, _ := json.Marshal(project.BackendDevelopers)
		frontendDevelopersJSON, _ := json.Marshal(project.FrontendDevelopers)
		qaTestersJSON, _ := json.Marshal(project.QaTesters)
		commentsJSON, _ := json.Marshal(project.Comments)
		changeLogJSON, _ := json.Marshal(project.ChangeLog)

		_, err := h.db.Exec(`
			INSERT INTO projects (
				id, name, priority, business_problem, key_result_ids, weekly_update, 
				last_week_update, status, product_managers, backend_developers, 
				frontend_developers, qa_testers, proposal_date, launch_date, 
				followers, comments, change_log
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
			project.ID, project.Name, project.Priority, project.BusinessProblem,
			pq.Array(project.KeyResultIds), project.WeeklyUpdate, project.LastWeekUpdate,
			project.Status, productManagersJSON, backendDevelopersJSON,
			frontendDevelopersJSON, qaTestersJSON, project.ProposalDate, project.LaunchDate,
			pq.Array(project.Followers), commentsJSON, changeLogJSON)

		if err != nil {
			return err
		}
	}
	return nil
}
