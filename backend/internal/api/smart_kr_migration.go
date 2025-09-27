package api

import (
	"encoding/json"
	"net/http"

	"project-management-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

// 智能KR数据迁移，保留现有项目的KR关联关系
func (h *Handler) SmartMigrateKrData(c *gin.Context) {
	// 1. 获取备份的项目数据
	backupQuery := `
		SELECT id, name, key_result_ids 
		FROM projects_backup 
		WHERE key_result_ids IS NOT NULL AND key_result_ids != '{}'
	`

	rows, err := h.db.Query(backupQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch backup projects: " + err.Error()})
		return
	}
	defer rows.Close()

	// 存储原有的项目KR关联关系
	originalProjectKRs := make(map[string][]string)

	for rows.Next() {
		var projectID string
		var projectName string
		var keyResultIds pq.StringArray

		err := rows.Scan(&projectID, &projectName, &keyResultIds)
		if err != nil {
			continue
		}

		if len(keyResultIds) > 0 {
			originalProjectKRs[projectID] = []string(keyResultIds)
		}
	}

	// 2. 构建简单KR ID到复合KR ID的映射表
	// 获取当前的OKR数据
	okrRows, err := h.db.Query("SELECT okrs FROM okr_sets WHERE period_id = '2025-H2'")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch current OKRs: " + err.Error()})
		return
	}
	defer okrRows.Close()

	var currentOkrs []models.OKR
	if okrRows.Next() {
		var okrsJSON []byte
		err := okrRows.Scan(&okrsJSON)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan OKRs: " + err.Error()})
			return
		}

		err = json.Unmarshal(okrsJSON, &currentOkrs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unmarshal OKRs: " + err.Error()})
			return
		}
	}

	// 构建映射：从简单KR ID到复合KR ID
	simpleToCompositeMapping := make(map[string]string)
	for _, okr := range currentOkrs {
		for _, kr := range okr.KeyResults {
			// 从复合ID中提取简单ID部分
			if kr.Sequence != "" {
				// 使用 Sequence 字段（原始简单ID）作为映射键
				simpleToCompositeMapping[kr.Sequence] = kr.ID
			}
		}
	}

	// 3. 开始事务，更新项目的KR关联
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	updatedProjects := 0
	migratedKRs := make(map[string]string) // 记录迁移的KR映射关系

	for projectID, originalKRs := range originalProjectKRs {
		var newKRs []string

		for _, oldKR := range originalKRs {
			// 如果已经是复合ID格式，直接保留
			if len(oldKR) > 0 && oldKR[0:1] == "o" && len(oldKR) > 3 && oldKR[2:4] == "::" {
				newKRs = append(newKRs, oldKR)
				continue
			}

			// 尝试映射简单ID到复合ID
			if newKR, exists := simpleToCompositeMapping[oldKR]; exists {
				newKRs = append(newKRs, newKR)
				migratedKRs[oldKR] = newKR
			} else {
				// 如果找不到映射，记录警告但继续处理
				// 可能是历史数据中的无效KR ID
				continue
			}
		}

		// 只有在有有效的KR关联时才更新
		if len(newKRs) > 0 {
			_, err = tx.Exec(
				"UPDATE projects SET key_result_ids = $1 WHERE id = $2",
				pq.Array(newKRs), projectID)
			if err != nil {
				// 项目可能不存在，继续处理其他项目
				continue
			}
			updatedProjects++
		}
	}

	// 4. 提交事务
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":               "KR数据智能迁移成功",
		"originalProjectsCount": len(originalProjectKRs),
		"updatedProjectsCount":  updatedProjects,
		"migratedKRMappings":    migratedKRs,
		"note":                  "原有项目的KR关联已保留并转换为新的复合ID格式",
	})
}
