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
	daysStr  := c.DefaultQuery("days", "7")

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