package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"langittoba/backend/pkg/httpclient"
)

type ForecastHandler struct {
	InferenceClient *httpclient.InferenceClient
}

func NewForecastHandler(client *httpclient.InferenceClient) *ForecastHandler {
	return &ForecastHandler{InferenceClient: client}
}

// GetForecast godoc
// GET /api/forecast?location=balige&days=7
func (h *ForecastHandler) GetForecast(c *gin.Context) {
	location := c.DefaultQuery("location", "balige")
	daysStr   := c.DefaultQuery("days", "7")

	days, err := strconv.Atoi(daysStr)
	if err != nil || days < 1 || days > 14 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Parameter 'days' harus angka antara 1-14",
		})
		return
	}

	result, err := h.InferenceClient.Predict(location, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Gagal mengambil prediksi",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetLocations godoc
// GET /api/locations
func (h *ForecastHandler) GetLocations(c *gin.Context) {
	locations := []gin.H{
		{"key": "balige",      "label": "Balige (Tobasa)",      "lat": -2.3333, "lon": 99.0667},
		{"key": "parapat",     "label": "Parapat",              "lat": -2.6600, "lon": 98.9400},
		{"key": "pangururan",  "label": "Pangururan (Samosir)", "lat": -2.5900, "lon": 98.6900},
		{"key": "nainggolan",  "label": "Nainggolan",           "lat": -2.6300, "lon": 98.8100},
		{"key": "tengah_danau","label": "Tengah Danau Toba",    "lat": -2.6000, "lon": 98.8000},
	}
	c.JSON(http.StatusOK, gin.H{"locations": locations})
}