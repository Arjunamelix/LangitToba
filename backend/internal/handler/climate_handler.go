package handler

import (
	"encoding/csv"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ClimateHandler struct{}

func NewClimateHandler() *ClimateHandler {
	return &ClimateHandler{}
}

// GetClimateSummary — statistik iklim historis dari CSV
// GET /api/climate?location=balige
func (h *ClimateHandler) GetClimateSummary(c *gin.Context) {
	location := c.DefaultQuery("location", "Balige (Tobasa)")

	// Baca CSV processed
	file, err := os.Open("../data/processed/features_toba.csv")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membaca data iklim",
		})
		return
	}
	defer file.Close()

	reader  := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal parse CSV"})
		return
	}

	// Cari index kolom
	headers := records[0]
	colIdx  := map[string]int{}
	for i, h := range headers {
		colIdx[h] = i
	}

	// Filter per lokasi & hitung statistik
	var tempMaxVals, precipVals []float64
	for _, row := range records[1:] {
		if row[colIdx["location"]] != location {
			continue
		}
		if v, err := strconv.ParseFloat(row[colIdx["temperature_2m_max"]], 64); err == nil {
			tempMaxVals = append(tempMaxVals, v)
		}
		if v, err := strconv.ParseFloat(row[colIdx["precipitation_sum"]], 64); err == nil {
			precipVals = append(precipVals, v)
		}
	}

	avgTemp  := average(tempMaxVals)
	avgRain  := average(precipVals)
	maxTemp  := maxVal(tempMaxVals)
	maxRain  := maxVal(precipVals)

	c.JSON(http.StatusOK, gin.H{
		"location"        : location,
		"period"          : "2015-2024",
		"avg_temp_max"    : round2(avgTemp),
		"avg_precipitation": round2(avgRain),
		"max_temp"        : round2(maxTemp),
		"max_precipitation": round2(maxRain),
		"total_days"      : len(tempMaxVals),
	})
}

func average(vals []float64) float64 {
	if len(vals) == 0 { return 0 }
	sum := 0.0
	for _, v := range vals { sum += v }
	return sum / float64(len(vals))
}

func maxVal(vals []float64) float64 {
	if len(vals) == 0 { return 0 }
	m := vals[0]
	for _, v := range vals { if v > m { m = v } }
	return m
}

func round2(v float64) float64 {
	return float64(int(v*100)) / 100
}