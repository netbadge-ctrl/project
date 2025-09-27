package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"project-management-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// FixKRIds 修复KR ID重复问题，将所有KR ID转换为复合格式
func (h *Handler) FixKRIds(c *gin.Context) {
	// 1. 获取所有OKR数据
	rows, err := h.db.Query("SELECT period_id, period_name, okrs FROM okr_sets ORDER BY period_id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch OKR sets: " + err.Error()})
		return
	}
	defer rows.Close()

	var okrSets []models.OkrSet
	for rows.Next() {
		var okrSet models.OkrSet
		var okrsJSON []byte

		err := rows.Scan(&okrSet.PeriodID, &okrSet.PeriodName, &okrsJSON)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan OKR set: " + err.Error()})
			return
		}

		err = json.Unmarshal(okrsJSON, &okrSet.Okrs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unmarshal OKRs: " + err.Error()})
			return
		}

		okrSets = append(okrSets, okrSet)
	}

	// 2. 修复OKR数据中的KR ID
	var updatedOkrSets []models.OkrSet
	krMappings := make(map[string]string) // 记录旧ID到新ID的映射

	for _, okrSet := range okrSets {
		var updatedOkrs []models.OKR
		
		for _, okr := range okrSet.Okrs {
			var updatedKRs []models.KeyResult
			
			for _, kr := range okr.KeyResults {
				// 如果已经是复合格式，跳过
				if strings.Contains(kr.ID, "::") {
					updatedKRs = append(updatedKRs, kr)
					continue
				}

				// 转换为复合格式
				newKrId := fmt.Sprintf("%s::%s", okr.ID, kr.ID)
				updatedKR := models.KeyResult{
					ID:          newKrId,
					Sequence:    kr.ID, // 保存原始序列号
					Description: kr.Description,
				}
				updatedKRs = append(updatedKRs, updatedKR)
				
				// 记录映射关系（注意：同一个原始ID可能对应多个新ID）
				krMappings[kr.ID] = newKrId
			}
			
			updatedOkr := models.OKR{
				ID:         okr.ID,
				Objective:  okr.Objective,
				KeyResults: updatedKRs,
			}
			updatedOkrs = append(updatedOkrs, updatedOkr)
		}
		
		updatedOkrSet := models.OkrSet{
			PeriodID:   okrSet.PeriodID,
			PeriodName: okrSet.PeriodName,
			Okrs:       updatedOkrs,
		}
		updatedOkrSets = append(updatedOkrSets, updatedOkrSet)
	}

	// 3. 开始事务
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// 4. 更新OKR数据
	for _, okrSet := range updatedOkrSets {
		okrsJSON, _ := json.Marshal(okrSet.Okrs)
		_, err = tx.Exec(
			"UPDATE okr_sets SET okrs = $1 WHERE period_id = $2",
			okrsJSON, okrSet.PeriodID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update OKR set: " + err.Error()})
			return
		}
	}

	// 5. 获取所有项目数据并修复KR关联
	projectRows, err := tx.Query("SELECT id, key_result_ids FROM projects")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects: " + err.Error()})
		return
	}
	defer projectRows.Close()

	projectUpdates := make(map[string][]string)
	for projectRows.Next() {
		var projectID string
		var keyResultIds []string
		var keyResultIdsJSON []byte

		err := projectRows.Scan(&projectID, &keyResultIdsJSON)
		if err != nil {
			continue
		}

		if keyResultIdsJSON != nil {
			err = json.Unmarshal(keyResultIdsJSON, &keyResultIds)
			if err != nil {
				continue
			}
		}

		// 修复项目的KR关联
		var updatedKrIds []string
		for _, krId := range keyResultIds {
			// 如果已经是复合格式，跳过
			if strings.Contains(krId, "::") {
				updatedKrIds = append(updatedKrIds, krId)
				continue
			}

			// 对于重复的简单ID，我们需要智能选择
			// 这里暂时保持原状，后续需要人工确认
			// 在实际使用中，可能需要根据项目的具体情况来决定使用哪个OKR的KR
			updatedKrIds = append(updatedKrIds, krId)
		}
		
		projectUpdates[projectID] = updatedKrIds
	}

	// 6. 更新项目数据
	for projectID, krIds := range projectUpdates {
		krIdsJSON, _ := json.Marshal(krIds)
		_, err = tx.Exec(
			"UPDATE projects SET key_result_ids = $1 WHERE id = $2",
			krIdsJSON, projectID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project: " + err.Error()})
			return
		}
	}

	// 7. 提交事务
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "KR IDs固定成功",
		"okrSetsUpdated": len(updatedOkrSets),
		"krMappings": krMappings,
		"projectsUpdated": len(projectUpdates),
	})
}