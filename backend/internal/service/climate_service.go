package service

import (
	"fmt"
	"langittoba/backend/internal/model"
	"langittoba/backend/internal/repository"
	"langittoba/backend/pkg/httpclient"
)

type ClimateStats struct {
	Location         string  `json:"location"`
	LocationLabel    string  `json:"location_label"`
	Lat              float64 `json:"lat"`
	Lon              float64 `json:"lon"`
	AvgTempMax       float64 `json:"avg_temp_max"`
	AvgTempMin       float64 `json:"avg_temp_min"`
	AvgPrecipitation float64 `json:"avg_precipitation"`
	AvgWindspeed     float64 `json:"avg_windspeed"`
	MaxTemp          float64 `json:"max_temp"`
	MaxPrecipitation float64 `json:"max_precipitation"`
	MinTempEver      float64 `json:"min_temp_ever"`
	RainyDaysPercent float64 `json:"rainy_days_percent"`
	TotalDays        int     `json:"total_days"`
	Period           string  `json:"period"`
}

type ClimateService struct {
	locationRepo    *repository.LocationRepository
	inferenceClient *httpclient.InferenceClient
}

func NewClimateService(
	locationRepo *repository.LocationRepository,
	inferenceClient *httpclient.InferenceClient,
) *ClimateService {
	return &ClimateService{
		locationRepo:    locationRepo,
		inferenceClient: inferenceClient,
	}
}

func (s *ClimateService) GetClimate(locationKey string) (*ClimateStats, error) {
	loc, err := s.locationRepo.GetByKey(locationKey)
	if err != nil {
		return nil, fmt.Errorf("lokasi '%s' tidak ditemukan", locationKey)
	}
	forecast, err := s.inferenceClient.Predict(locationKey, 14)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data dari inference layer: %w", err)
	}
	return aggregateClimate(loc, forecast), nil
}

func (s *ClimateService) GetAllClimate() ([]*ClimateStats, error) {
	tahap := 1
	locations, err := s.locationRepo.GetAll(&tahap)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil daftar lokasi: %w", err)
	}
	results := make([]*ClimateStats, 0, len(locations))
	for _, loc := range locations {
		forecast, err := s.inferenceClient.Predict(loc.Key, 14)
		if err != nil {
			continue
		}
		results = append(results, aggregateClimate(&loc, forecast))
	}
	return results, nil
}

func aggregateClimate(loc *model.Location, forecast *model.ForecastResponse) *ClimateStats {
	stats := &ClimateStats{
		Location:      loc.Key,
		LocationLabel: loc.Label,
		Lat:           loc.Lat,
		Lon:           loc.Lon,
		Period:        fmt.Sprintf("%d hari ke depan", len(forecast.Forecast)),
		TotalDays:     len(forecast.Forecast),
	}
	if len(forecast.Forecast) == 0 {
		return stats
	}
	var sumTempMax, sumTempMin, sumPrecip, sumWind float64
	maxTemp := forecast.Forecast[0].TempMax
	minTemp := forecast.Forecast[0].TempMin
	maxPrecip := forecast.Forecast[0].Precipitation
	rainyDays := 0
	for _, day := range forecast.Forecast {
		sumTempMax += day.TempMax
		sumTempMin += day.TempMin
		sumPrecip += day.Precipitation
		sumWind += day.WindspeedMax
		if day.TempMax > maxTemp {
			maxTemp = day.TempMax
		}
		if day.TempMin < minTemp {
			minTemp = day.TempMin
		}
		if day.Precipitation > maxPrecip {
			maxPrecip = day.Precipitation
		}
		if day.Precipitation > 1.0 {
			rainyDays++
		}
	}
	n := float64(len(forecast.Forecast))
	stats.AvgTempMax = sumTempMax / n
	stats.AvgTempMin = sumTempMin / n
	stats.AvgPrecipitation = sumPrecip / n
	stats.AvgWindspeed = sumWind / n
	stats.MaxTemp = maxTemp
	stats.MinTempEver = minTemp
	stats.MaxPrecipitation = maxPrecip
	stats.RainyDaysPercent = float64(rainyDays) / n * 100
	return stats
}