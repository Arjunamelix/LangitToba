package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"langittoba/backend/internal/repository"
	"langittoba/backend/internal/service"
)

const forecastCacheTTL = 6 * time.Hour

type ForecastHandler struct {
	forecastSvc *service.ForecastService
	weatherRepo *repository.WeatherRepository
}

func NewForecastHandler(
	forecastSvc *service.ForecastService,
	weatherRepo *repository.WeatherRepository,
) *ForecastHandler {
	return &ForecastHandler{
		forecastSvc: forecastSvc,
		weatherRepo: weatherRepo,
	}
}

func (h *ForecastHandler) GetForecast(c *gin.Context) {
	locationKey := c.Query("location")
	daysStr := c.DefaultQuery("days", "7")

	if locationKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parameter 'location' wajib diisi"})
		return
	}

	days, err := strconv.Atoi(daysStr)
	if err != nil || days < 1 || days > 14 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parameter 'days' harus antara 1–14"})
		return
	}

	// ── 1. Cek cache ──────────────────────────────────────────────────────────
	cached, err := h.weatherRepo.GetCache(locationKey, days)
	if err == nil && cached != nil {
		var result any
		if jsonErr := json.Unmarshal(cached.Result, &result); jsonErr == nil {
			c.JSON(http.StatusOK, gin.H{
				"source":     "cache",
				"expires_at": cached.ExpiresAt.Format(time.RFC3339),
				"forecast":   result,
			})
			return
		}
	}

	// ── 2. Cache miss — fetch dari FastAPI via ForecastService ────────────────
	forecast, err := h.forecastSvc.GetForecast(locationKey, days)
	if err != nil {
		// forecast_service.go format error: "lokasi '%s' tidak ditemukan"
		if errors.Is(err, service.ErrLocationNotFound) ||
			containsNotFound(err.Error()) {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("lokasi '%s' tidak ditemukan", locationKey)})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ── 3. Simpan ke cache ────────────────────────────────────────────────────
	raw, err := json.Marshal(forecast)
	if err == nil {
		_ = h.weatherRepo.SetCache(locationKey, days, raw, forecastCacheTTL)
	}

	c.JSON(http.StatusOK, gin.H{
		"source":   "live",
		"forecast": forecast,
	})
}

func containsNotFound(msg string) bool {
	return len(msg) > 0 &&
		(len(msg) >= 12 && msg[:12] == "lokasi '") ||
		(len(msg) >= 14 && msg[len(msg)-14:] == "tidak ditemukan")
}