package job

import (
	"encoding/json"
	"log"
	"time"

	"langittoba/backend/internal/repository"
	"langittoba/backend/internal/service"
)

const (
	batchSize    = 10
	batchDelay   = 1 * time.Second
	forecastDays = 7
	cacheTTL     = 6 * time.Hour
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

// Run — fetch prediksi semua lokasi aktif dan simpan ke cache
func (j *ForecastRefreshJob) Run() error {
	tahap := 1
	locations, err := j.locationRepo.GetAll(&tahap)
	if err != nil {
		return err
	}

	log.Printf("[forecast_refresh] Mulai refresh %d lokasi", len(locations))
	success, failed := 0, 0

	for i := 0; i < len(locations); i += batchSize {
		end := i + batchSize
		if end > len(locations) {
			end = len(locations)
		}
		batch := locations[i:end]

		for _, loc := range batch {
			forecast, err := j.forecastSvc.GetForecast(loc.Key, forecastDays)
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