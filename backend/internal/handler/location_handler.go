package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"langittoba/backend/internal/repository"
)

type LocationHandler struct {
	locationRepo *repository.LocationRepository
}

func NewLocationHandler(repo *repository.LocationRepository) *LocationHandler {
	return &LocationHandler{locationRepo: repo}
}

// GetLocations godoc
// GET /api/locations?tahap=1
// tahap param optional — kalau tidak diisi, return semua lokasi aktif
func (h *LocationHandler) GetLocations(c *gin.Context) {
	var tahapPtr *int

	tahapStr := c.Query("tahap")
	if tahapStr != "" {
		tahap, err := strconv.Atoi(tahapStr)
		if err != nil || tahap < 1 || tahap > 4 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Parameter 'tahap' harus angka antara 1-4",
			})
			return
		}
		tahapPtr = &tahap
	}

	locations, err := h.locationRepo.GetAll(tahapPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Gagal mengambil data lokasi",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total":     len(locations),
		"locations": locations,
	})
}

// GetLocationByKey godoc
// GET /api/locations/:key
func (h *LocationHandler) GetLocationByKey(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Key lokasi tidak boleh kosong"})
		return
	}

	loc, err := h.locationRepo.GetByKey(key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Lokasi tidak ditemukan: " + key,
		})
		return
	}

	c.JSON(http.StatusOK, loc)
}