package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"langittoba/backend/internal/service"
)

type WarningHandler struct {
	warningSvc *service.WarningService
}

func NewWarningHandler(warningSvc *service.WarningService) *WarningHandler {
	return &WarningHandler{warningSvc: warningSvc}
}

// GET /api/warnings
func (h *WarningHandler) GetWarnings(c *gin.Context) {
	warnings, err := h.warningSvc.GetWarnings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_warnings": len(warnings),
		"warnings":       warnings,
	})
}

// GET /api/warnings/:key
func (h *WarningHandler) GetWarningByLocation(c *gin.Context) {
	key := c.Param("key")
	warning, err := h.warningSvc.GetWarningByLocation(key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, warning)
}