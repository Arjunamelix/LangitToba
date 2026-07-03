package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"langittoba/backend/pkg/httpclient"
)

type WarningHandler struct {
	InferenceClient *httpclient.InferenceClient
}

func NewWarningHandler(client *httpclient.InferenceClient) *WarningHandler {
	return &WarningHandler{InferenceClient: client}
}

// GetWarnings — cek warning dari forecast 14 hari semua lokasi
// GET /api/warnings
func (h *WarningHandler) GetWarnings(c *gin.Context) {
	locations := []string{"balige", "parapat", "pangururan", "nainggolan", "tengah_danau"}
	var activeWarnings []gin.H

	for _, loc := range locations {
		result, err := h.InferenceClient.Predict(loc, 14)
		if err != nil {
			continue
		}

		for _, day := range result.Forecast {
			if len(day.Warnings) > 0 {
				activeWarnings = append(activeWarnings, gin.H{
					"location"      : loc,
					"location_label": result.LocationLabel,
					"date"          : day.Date,
					"risk_level"    : day.RiskLevel,
					"warnings"      : day.Warnings,
				})
			}
		}
	}

	if activeWarnings == nil {
		activeWarnings = []gin.H{}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_warnings": len(activeWarnings),
		"warnings":       activeWarnings,
	})
}