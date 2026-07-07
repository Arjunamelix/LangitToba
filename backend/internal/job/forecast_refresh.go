package job

import (
	"encoding/json"
	"log"
	"strings"
	"time"

	"langittoba/backend/internal/repository"
	"langittoba/backend/internal/service"
)

const (
	batchSize    = 10
	batchDelay   = 5 * time.Second  // dinaikkan dari 1s → 5s
	forecastDays = 7
	cacheTTL     = 6 * time.Hour

	retryDelay429 = 30 * time.Second // tunggu 30s jika kena 429
	maxRetries    = 3                // maksimal 3x retry per lokasi
)

type ForecastRefreshJob struct {
	locationRepo *repository.LocationRepository
	forecastSvc  *service.ForecastService
	weatherRepo  *repository.WeatherRepository
}

func NewForecastRefreshJob(
	locationRepo *repository.LocationRepository,
	forecastSvc  *service.ForecastService,
	weatherRepo  *repository.WeatherRepository,
) *ForecastRefreshJob {
	return &ForecastRefreshJob{
		locationRepo: locationRepo,
		forecastSvc:  forecastSvc,
		weatherRepo:  weatherRepo,
	}
}

// fetchWithRetry — coba GetForecast sampai maxRetries kali.
// Jika error mengandung "429", tunggu retryDelay429 sebelum retry.
// Jika error lain, langsung return error (tidak retry).
func (j *ForecastRefreshJob) fetchWithRetry(key string) (interface{}, error) {
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		forecast, err := j.forecastSvc.GetForecast(key, forecastDays)
		if err == nil {
			return forecast, nil
		}

		lastErr = err

		if strings.Contains(err.Error(), "429") {
			log.Printf("[forecast_refresh] 429 pada %s (attempt %d/%d) — tunggu %s",
				key, attempt, maxRetries, retryDelay429)
			time.Sleep(retryDelay429)
			continue
		}

		// Error bukan 429 — tidak perlu retry
		return nil, err
	}

	return nil, lastErr
}

// Run — fetch prediksi semua lokasi aktif dan simpan ke cache
func (j *ForecastRefreshJob) Run() error {
	tahap := 1
	locations, err := j.locationRepo.GetAll(&tahap)
	if err != nil {
		return err
	}

	log.Printf("[forecast_refresh] Mulai refresh %d lokasi (jeda %s antar batch, backoff %s untuk 429)",
		len(locations), batchDelay, retryDelay429)
	success, failed := 0, 0

	for i := 0; i < len(locations); i += batchSize {
		end := i + batchSize
		if end > len(locations) {
			end = len(locations)
		}
		batch := locations[i:end]
		batchNum := i/batchSize + 1
		totalBatches := (len(locations) + batchSize - 1) / batchSize

		log.Printf("[forecast_refresh] Batch %d/%d (%d lokasi)", batchNum, totalBatches, len(batch))

		for _, loc := range batch {
			forecast, err := j.fetchWithRetry(loc.Key)
			if err != nil {
				log.Printf("[forecast_refresh] Skip %s: %v", loc.Key, err)
				failed++
				continue
			}

			raw, err := json.Marshal(forecast)
			if err != nil {
				log.Printf("[forecast_refresh] Marshal gagal %s: %v", loc.Key, err)
				failed++
				continue
			}

			if err := j.weatherRepo.SetCache(loc.Key, forecastDays, raw, cacheTTL); err != nil {
				log.Printf("[forecast_refresh] Cache gagal %s: %v", loc.Key, err)
				failed++
				continue
			}

			success++
		}

		// Jeda antar batch (kecuali batch terakhir)
		if end < len(locations) {
			time.Sleep(batchDelay)
		}
	}

	// Hapus cache expired
	deleted, _ := j.weatherRepo.DeleteExpired()
	if deleted > 0 {
		log.Printf("[forecast_refresh] Hapus %d cache expired", deleted)
	}

	log.Printf("[forecast_refresh] Selesai — sukses: %d, gagal: %d", success, failed)
	return nil
}