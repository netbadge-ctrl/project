package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

// 为示例项目添加合理的KR关联，演示新的复合ID系统
func (h *Handler) AddSampleKrAssociations(c *gin.Context) {
	// 定义一些示例项目的KR关联，使用新的复合ID格式
	sampleAssociations := map[string][]string{
		// 基于项目名称的智能KR关联建议
	}

	// 获取前10个项目并为它们分配合理的KR关联
	rows, err := h.db.Query("SELECT id, name FROM projects LIMIT 10")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects: " + err.Error()})
		return
	}
	defer rows.Close()

	projects := make(map[string]string) // id -> name
	for rows.Next() {
		var id, name string
		if err := rows.Scan(&id, &name); err != nil {
			continue
		}
		projects[id] = name
	}

	// 基于项目名称智能分配KR关联
	count := 0
	for projectID, projectName := range projects {
		var krIds []string

		// 根据项目名称特征分配相关的KR
		if containsAny(projectName, []string{"网络", "CDN", "带宽", "延迟"}) {
			krIds = []string{"o3::kr1", "o3::kr3"} // 网络相关
		} else if containsAny(projectName, []string{"服务器", "GPU", "计算", "性能"}) {
			krIds = []string{"o1::kr2", "o1::kr4"} // 服务器相关
		} else if containsAny(projectName, []string{"账单", "计费", "成本", "财务"}) {
			krIds = []string{"o2::kr1", "o2::kr2"} // 财务相关
		} else if containsAny(projectName, []string{"控制台", "界面", "前端", "体验"}) {
			krIds = []string{"o4::kr2", "o4::kr3"} // 用户体验相关
		} else if containsAny(projectName, []string{"技术", "分享", "文档", "知识"}) {
			krIds = []string{"o5::kr2", "o5::kr4"} // 团队建设相关
		} else {
			// 默认分配一个通用的KR
			krIds = []string{"o1::kr1"}
		}

		sampleAssociations[projectID] = krIds
		count++
		if count >= 10 { // 限制处理数量
			break
		}
	}

	// 开始事务更新项目的KR关联
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	updatedProjects := 0
	for projectID, krIds := range sampleAssociations {
		_, err = tx.Exec(
			"UPDATE projects SET key_result_ids = $1 WHERE id = $2",
			pq.Array(krIds), projectID)
		if err != nil {
			continue
		}
		updatedProjects++
	}

	// 提交事务
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "示例KR关联添加成功",
		"updatedProjects":    updatedProjects,
		"sampleAssociations": sampleAssociations,
		"note":               "为示例项目添加了合理的KR关联，演示复合ID系统的工作效果",
	})
}

// 辅助函数：检查字符串是否包含任何关键词
func containsAny(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if len(keyword) > 0 && len(text) >= len(keyword) {
			for i := 0; i <= len(text)-len(keyword); i++ {
				if text[i:i+len(keyword)] == keyword {
					return true
				}
			}
		}
	}
	return false
}
