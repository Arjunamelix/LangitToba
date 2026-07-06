package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"langittoba/backend/internal/service"
)

type ClimateHandler struct {
	climateSvc *service.ClimateService
}

func NewClimateHandler(climateSvc *service.ClimateService) *ClimateHandler {
	return &ClimateHandler{climateSvc: climateSvc}
}

// GET /api/climate?location=balige
func (h *ClimateHandler) GetClimateSummary(c *gin.Context) {
	locationKey := c.DefaultQuery("location", "balige")
	summary, err := h.climateSvc.GetClimate(locationKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

// GET /api/climate/all
func (h *ClimateHandler) GetAllClimate(c *gin.Context) {
	summaries, err := h.climateSvc.GetAllClimate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"total":   len(summaries),
		"climate": summaries,
	})
}