package api

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"project-management-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// GetProjects 获取所有项目
func (h *Handler) GetProjects(c *gin.Context) {
	query := `
		SELECT id, name, priority, business_problem, key_result_ids, weekly_update, 
		       last_week_update, status, product_managers, backend_developers, 
		       frontend_developers, qa_testers, proposal_date, launch_date, 
		       followers, comments, change_log
		FROM projects
		ORDER BY id
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		var keyResultIds pq.StringArray
		var followers pq.StringArray
		var productManagers, backendDevelopers, frontendDevelopers, qaTesters []byte
		var comments, changeLog []byte

		err := rows.Scan(
			&p.ID, &p.Name, &p.Priority, &p.BusinessProblem, &keyResultIds,
			&p.WeeklyUpdate, &p.LastWeekUpdate, &p.Status, &productManagers,
			&backendDevelopers, &frontendDevelopers, &qaTesters,
			&p.ProposalDate, &p.LaunchDate, &followers, &comments, &changeLog,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// 转换数组类型
		p.KeyResultIds = []string(keyResultIds)
		p.Followers = []string(followers)

		// 解析JSONB字段
		json.Unmarshal(productManagers, &p.ProductManagers)
		json.Unmarshal(backendDevelopers, &p.BackendDevelopers)
		json.Unmarshal(frontendDevelopers, &p.FrontendDevelopers)
		json.Unmarshal(qaTesters, &p.QaTesters)
		json.Unmarshal(comments, &p.Comments)
		json.Unmarshal(changeLog, &p.ChangeLog)

		projects = append(projects, p)
	}

	c.JSON(http.StatusOK, projects)
}

// CreateProject 创建新项目
func (h *Handler) CreateProject(c *gin.Context) {
	var project models.Project
	if err := c.ShouldBindJSON(&project); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 生成唯一ID
	project.ID = "p" + strconv.FormatInt(time.Now().UnixNano(), 10)

	// 处理必填字段的默认值
	if project.Name == "" {
		project.Name = "未命名项目"
	}
	if project.Priority == "" {
		project.Priority = "日常需求"
	}
	if project.Status == "" {
		project.Status = "未开始"
	}

	// 处理日期字段的空字符串问题
	if project.ProposalDate != nil && *project.ProposalDate == "" {
		project.ProposalDate = nil
	}
	if project.LaunchDate != nil && *project.LaunchDate == "" {
		project.LaunchDate = nil
	}

	// 初始化数组字段
	if project.KeyResultIds == nil {
		project.KeyResultIds = []string{}
	}
	if project.Followers == nil {
		project.Followers = []string{}
	}
	if project.ProductManagers == nil {
		project.ProductManagers = []models.TeamMember{}
	}
	if project.BackendDevelopers == nil {
		project.BackendDevelopers = []models.TeamMember{}
	}
	if project.FrontendDevelopers == nil {
		project.FrontendDevelopers = []models.TeamMember{}
	}
	if project.QaTesters == nil {
		project.QaTesters = []models.TeamMember{}
	}
	if project.Comments == nil {
		project.Comments = []models.Comment{}
	}
	if project.ChangeLog == nil {
		project.ChangeLog = []models.ChangeLogEntry{}
	}

	// 序列化JSONB字段
	productManagersJSON, _ := json.Marshal(project.ProductManagers)
	backendDevelopersJSON, _ := json.Marshal(project.BackendDevelopers)
	frontendDevelopersJSON, _ := json.Marshal(project.FrontendDevelopers)
	qaTestersJSON, _ := json.Marshal(project.QaTesters)
	commentsJSON, _ := json.Marshal(project.Comments)
	changeLogJSON, _ := json.Marshal(project.ChangeLog)

	query := `
		INSERT INTO projects (
			id, name, priority, business_problem, key_result_ids, weekly_update, 
			last_week_update, status, product_managers, backend_developers, 
			frontend_developers, qa_testers, proposal_date, launch_date, 
			followers, comments, change_log
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`

	_, err := h.db.Exec(query,
		project.ID, project.Name, project.Priority, project.BusinessProblem,
		pq.Array(project.KeyResultIds), project.WeeklyUpdate, project.LastWeekUpdate,
		project.Status, productManagersJSON, backendDevelopersJSON,
		frontendDevelopersJSON, qaTestersJSON, project.ProposalDate, project.LaunchDate,
		pq.Array(project.Followers), commentsJSON, changeLogJSON)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, project)
}

// UpdateProject 更新项目
func (h *Handler) UpdateProject(c *gin.Context) {
	projectID := c.Param("projectId")

	var updates models.Project
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 首先获取现有项目
	var existing models.Project
	query := `
		SELECT id, name, priority, business_problem, key_result_ids, weekly_update, 
		       last_week_update, status, product_managers, backend_developers, 
		       frontend_developers, qa_testers, proposal_date, launch_date, 
		       followers, comments, change_log
		FROM projects WHERE id = $1
	`

	var keyResultIds pq.StringArray
	var followers pq.StringArray
	var productManagers, backendDevelopers, frontendDevelopers, qaTesters []byte
	var comments, changeLog []byte

	err := h.db.QueryRow(query, projectID).Scan(
		&existing.ID, &existing.Name, &existing.Priority, &existing.BusinessProblem, &keyResultIds,
		&existing.WeeklyUpdate, &existing.LastWeekUpdate, &existing.Status, &productManagers,
		&backendDevelopers, &frontendDevelopers, &qaTesters,
		&existing.ProposalDate, &existing.LaunchDate, &followers, &comments, &changeLog,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// 转换现有数据
	existing.KeyResultIds = []string(keyResultIds)
	existing.Followers = []string(followers)
	json.Unmarshal(productManagers, &existing.ProductManagers)
	json.Unmarshal(backendDevelopers, &existing.BackendDevelopers)
	json.Unmarshal(frontendDevelopers, &existing.FrontendDevelopers)
	json.Unmarshal(qaTesters, &existing.QaTesters)
	json.Unmarshal(comments, &existing.Comments)
	json.Unmarshal(changeLog, &existing.ChangeLog)

	// 合并更新
	if updates.Name != "" {
		existing.Name = updates.Name
	}
	if updates.Priority != "" {
		existing.Priority = updates.Priority
	}
	if updates.Status != "" {
		existing.Status = updates.Status
	}
	if updates.BusinessProblem != nil {
		existing.BusinessProblem = updates.BusinessProblem
	}
	if updates.WeeklyUpdate != nil {
		existing.WeeklyUpdate = updates.WeeklyUpdate
	}
	if updates.LastWeekUpdate != nil {
		existing.LastWeekUpdate = updates.LastWeekUpdate
	}
	if updates.ProposalDate != nil {
		existing.ProposalDate = updates.ProposalDate
	}
	if updates.LaunchDate != nil {
		existing.LaunchDate = updates.LaunchDate
	}
	if updates.KeyResultIds != nil {
		existing.KeyResultIds = updates.KeyResultIds
	}
	if updates.Followers != nil {
		existing.Followers = updates.Followers
	}
	if updates.ProductManagers != nil {
		existing.ProductManagers = updates.ProductManagers
	}
	if updates.BackendDevelopers != nil {
		existing.BackendDevelopers = updates.BackendDevelopers
	}
	if updates.FrontendDevelopers != nil {
		existing.FrontendDevelopers = updates.FrontendDevelopers
	}
	if updates.QaTesters != nil {
		existing.QaTesters = updates.QaTesters
	}
	if updates.Comments != nil {
		existing.Comments = updates.Comments
	}
	if updates.ChangeLog != nil {
		existing.ChangeLog = updates.ChangeLog
	}

	// 序列化JSONB字段
	productManagersJSON, _ := json.Marshal(existing.ProductManagers)
	backendDevelopersJSON, _ := json.Marshal(existing.BackendDevelopers)
	frontendDevelopersJSON, _ := json.Marshal(existing.FrontendDevelopers)
	qaTestersJSON, _ := json.Marshal(existing.QaTesters)
	commentsJSON, _ := json.Marshal(existing.Comments)
	changeLogJSON, _ := json.Marshal(existing.ChangeLog)

	updateQuery := `
		UPDATE projects SET 
			name = $2, priority = $3, business_problem = $4, key_result_ids = $5, 
			weekly_update = $6, last_week_update = $7, status = $8, 
			product_managers = $9, backend_developers = $10, 
			frontend_developers = $11, qa_testers = $12, 
			proposal_date = $13, launch_date = $14, followers = $15, 
			comments = $16, change_log = $17
		WHERE id = $1
	`

	_, err = h.db.Exec(updateQuery,
		projectID, existing.Name, existing.Priority, existing.BusinessProblem,
		pq.Array(existing.KeyResultIds), existing.WeeklyUpdate, existing.LastWeekUpdate,
		existing.Status, productManagersJSON, backendDevelopersJSON,
		frontendDevelopersJSON, qaTestersJSON, existing.ProposalDate, existing.LaunchDate,
		pq.Array(existing.Followers), commentsJSON, changeLogJSON)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existing)
}

// DeleteProject 删除项目
func (h *Handler) DeleteProject(c *gin.Context) {
	projectID := c.Param("projectId")

	result, err := h.db.Exec("DELETE FROM projects WHERE id = $1", projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetUsers 获取所有用户
func (h *Handler) GetUsers(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, name, email, avatar_url FROM users ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.AvatarURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

// GetOkrSets 获取所有OKR集合
func (h *Handler) GetOkrSets(c *gin.Context) {
	rows, err := h.db.Query("SELECT period_id, period_name, okrs FROM okr_sets ORDER BY period_id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var okrSets []models.OkrSet
	for rows.Next() {
		var okrSet models.OkrSet
		var okrsJSON []byte
		err := rows.Scan(&okrSet.PeriodID, &okrSet.PeriodName, &okrsJSON)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		json.Unmarshal(okrsJSON, &okrSet.Okrs)
		okrSets = append(okrSets, okrSet)
	}

	c.JSON(http.StatusOK, okrSets)
}

// CreateOkrSet 创建新的OKR集合
func (h *Handler) CreateOkrSet(c *gin.Context) {
	var req struct {
		PeriodID   string `json:"periodId"`
		PeriodName string `json:"periodName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	okrSet := models.OkrSet{
		PeriodID:   req.PeriodID,
		PeriodName: req.PeriodName,
		Okrs:       []models.OKR{},
	}

	okrsJSON, _ := json.Marshal(okrSet.Okrs)

	_, err := h.db.Exec(
		"INSERT INTO okr_sets (period_id, period_name, okrs) VALUES ($1, $2, $3)",
		okrSet.PeriodID, okrSet.PeriodName, okrsJSON)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, okrSet)
}

// UpdateOkrSet 更新OKR集合
func (h *Handler) UpdateOkrSet(c *gin.Context) {
	periodID := c.Param("periodId")

	var okrSet models.OkrSet
	if err := c.ShouldBindJSON(&okrSet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	okrsJSON, _ := json.Marshal(okrSet.Okrs)

	result, err := h.db.Exec(
		"UPDATE okr_sets SET period_name = $2, okrs = $3 WHERE period_id = $1",
		periodID, okrSet.PeriodName, okrsJSON)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "OKR set not found"})
		return
	}

	c.JSON(http.StatusOK, okrSet)
}

// PerformWeeklyRollover 执行周会数据滚动
func (h *Handler) PerformWeeklyRollover(c *gin.Context) {
	query := `
		UPDATE projects 
		SET last_week_update = weekly_update
		WHERE weekly_update IS NOT NULL AND weekly_update != ''
		RETURNING id
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var updatedProjectIds []string
	for rows.Next() {
		var id string
		rows.Scan(&id)
		updatedProjectIds = append(updatedProjectIds, id)
	}

	c.JSON(http.StatusOK, gin.H{"updatedProjectIds": updatedProjectIds})
}

// RefreshUsers 清空用户数据并重新从接口同步
func (h *Handler) RefreshUsers(c *gin.Context) {
	// 1. 清空现有用户数据
	_, err := h.db.Exec("DELETE FROM users")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear users: " + err.Error()})
		return
	}

	// 2. 从接口获取员工数据
	employeeResp, err := h.fetchEmployeeData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employee data: " + err.Error()})
		return
	}

	// 3. 处理员工数据
	employees, exists := employeeResp.EmployeeList["28508728"]
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Department 28508728 not found in response"})
		return
	}

	// 4. 插入新的员工数据
	var insertedCount int
	for _, employee := range employees {
		if err := h.insertEmployee(employee); err != nil {
			continue // 跳过失败的记录，继续处理其他记录
		}
		insertedCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Users refreshed successfully",
		"totalEmployees": len(employees),
		"insertedCount":  insertedCount,
	})
}

func (h *Handler) fetchEmployeeData() (models.EmployeeResponse, error) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("GET", "http://10.69.67.224/dept/employee/list?dept_ids=28508728", nil)
	if err != nil {
		return models.EmployeeResponse{}, fmt.Errorf("failed to create request: %w", err)
	}

	// 设置请求头
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Basic QUs1YWRkZDVkMjJiNThiOlNLNWFkZGQ1ZDIyYjVjYg==")
	req.Header.Set("Host", "contact.inner.sdns.ksyun.com")

	resp, err := client.Do(req)
	if err != nil {
		return models.EmployeeResponse{}, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return models.EmployeeResponse{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return models.EmployeeResponse{}, fmt.Errorf("failed to read response body: %w", err)
	}

	var employeeResp models.EmployeeResponse
	if err := json.Unmarshal(body, &employeeResp); err != nil {
		return models.EmployeeResponse{}, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return employeeResp, nil
}

func (h *Handler) insertEmployee(employee models.Employee) error {
	userID := strconv.Itoa(employee.EmployeeID)
	avatarURL := fmt.Sprintf("https://picsum.photos/seed/%d/40/40", employee.EmployeeID)

	insertQuery := "INSERT INTO users (id, name, email, avatar_url) VALUES ($1, $2, $3, $4)"
	_, err := h.db.Exec(insertQuery, userID, employee.RealName, employee.Email, avatarURL)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}

	return nil
}

// CheckAuth 检查用户认证状态
func (h *Handler) CheckAuth(c *gin.Context) {
	// 获取所有cookie，转发给金山云API
	cookies := c.Request.Header.Get("Cookie")
	
	if cookies == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No cookies found"})
		return
	}

	// 调用金山云认证API
	req, err := http.NewRequest("GET", "https://uss.ksyun.com/m/uss/api/v2/checklogin", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Cookie", cookies)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check auth"})
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response"})
		return
	}
	
	// 解析用户信息
	var userData map[string]interface{}
	if err := json.Unmarshal(body, &userData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}
	
	// 返回用户信息
	c.JSON(http.StatusOK, userData)
}

// OIDCTokenExchange 处理OIDC token交换
func (h *Handler) OIDCTokenExchange(c *gin.Context) {
	var req struct {
		Code        string `json:"code" binding:"required"`
		RedirectURI string `json:"redirect_uri" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// OIDC配置
	clientID := "api-uss"
	clientSecret := "fdd6739fdc5d36cf5f10b92b3464e165"
	tokenEndpoint := "https://oidc-public.ksyun.com:443/token"

	// 准备token交换请求
	formData := fmt.Sprintf("grant_type=authorization_code&code=%s&redirect_uri=%s&client_id=%s&client_secret=%s",
		req.Code, req.RedirectURI, clientID, clientSecret)
	
	fmt.Printf("OIDC Token request - URL: %s, Data: %s\n", tokenEndpoint, formData)

	tokenReq, err := http.NewRequest("POST", tokenEndpoint, bytes.NewBufferString(formData))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token request"})
		return
	}

	tokenReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(tokenReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read token response"})
		return
	}

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("OIDC Token exchange failed - Status: %d, Response: %s\n", resp.StatusCode, string(body))
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Token exchange failed with status %d: %s", resp.StatusCode, string(body)),
		})
		return
	}

	fmt.Printf("OIDC Token exchange successful - Response: %s\n", string(body))

	// 解析token响应
	var tokenResponse map[string]interface{}
	if err := json.Unmarshal(body, &tokenResponse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse token response"})
		return
	}

	c.JSON(http.StatusOK, tokenResponse)
}
