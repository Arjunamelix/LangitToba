package service

import (
	"fmt"
	"langittoba/backend/internal/model"
	"langittoba/backend/internal/repository"
	"langittoba/backend/pkg/httpclient"
)

type RiskLevel string

const (
	RiskNormal  RiskLevel = "normal"
	RiskWarning RiskLevel = "warning"
	RiskOrange  RiskLevel = "orange"
	RiskRed     RiskLevel = "red"
)

const (
	ThresholdPrecipWarning float64 = 50.0
	ThresholdPrecipOrange  float64 = 100.0
	ThresholdWindWarning   float64 = 40.0
	ThresholdTempHot       float64 = 35.0
	ThresholdTempCold      float64 = 15.0
)

type LocationWarning struct {
	Location      string    `json:"location"`
	LocationLabel string    `json:"location_label"`
	Lat           float64   `json:"lat"`
	Lon           float64   `json:"lon"`
	RiskLevel     RiskLevel `json:"risk_level"`
	Warnings      []string  `json:"warnings"`
	TempMax       float64   `json:"temp_max"`
	Precipitation float64   `json:"precipitation"`
	WindspeedMax  float64   `json:"windspeed_max"`
}

type WarningService struct {
	locationRepo    *repository.LocationRepository
	inferenceClient *httpclient.InferenceClient
}

func NewWarningService(
	locationRepo *repository.LocationRepository,
	inferenceClient *httpclient.InferenceClient,
) *WarningService {
	return &WarningService{
		locationRepo:    locationRepo,
		inferenceClient: inferenceClient,
	}
}

// GetWarnings — evaluasi peringatan untuk semua lokasi aktif
func (s *WarningService) GetWarnings() ([]LocationWarning, error) {
	tahap := 1
	locations, err := s.locationRepo.GetAll(&tahap)
	if err != nil {
		return nil, fmt.Errorf("gagal ambil lokasi: %w", err)
	}

	results := make([]LocationWarning, 0, len(locations))
	for _, loc := range locations {
		forecast, err := s.inferenceClient.Predict(loc.Key, 1)
		if err != nil {
			continue
		}
		warning := s.evaluateWarning(&loc, forecast)
		results = append(results, warning)
	}
	return results, nil
}

// GetWarningByLocation — peringatan untuk satu lokasi
func (s *WarningService) GetWarningByLocation(locationKey string) (*LocationWarning, error) {
	loc, err := s.locationRepo.GetByKey(locationKey)
	if err != nil {
		return nil, fmt.Errorf("lokasi '%s' tidak ditemukan", locationKey)
	}
	forecast, err := s.inferenceClient.Predict(locationKey, 3)
	if err != nil {
		return nil, fmt.Errorf("gagal ambil prediksi: %w", err)
	}
	warning := s.evaluateWarning(loc, forecast)
	return &warning, nil
}

func (s *WarningService) evaluateWarning(loc *model.Location, forecast *model.ForecastResponse) LocationWarning {
	w := LocationWarning{
		Location:      loc.Key,
		LocationLabel: loc.Label,
		Lat:           loc.Lat,
		Lon:           loc.Lon,
		RiskLevel:     RiskNormal,
		Warnings:      []string{},
	}

	if forecast == nil || len(forecast.Forecast) == 0 {
		return w
	}

	day := forecast.Forecast[0]
	w.TempMax = day.TempMax
	w.Precipitation = day.Precipitation
	w.WindspeedMax = day.WindspeedMax

	maxRisk := RiskNormal

	if day.Precipitation >= ThresholdPrecipOrange {
		w.Warnings = append(w.Warnings, fmt.Sprintf("Hujan sangat lebat %.0f mm", day.Precipitation))
		maxRisk = highest(maxRisk, RiskRed)
	} else if day.Precipitation >= ThresholdPrecipWarning {
		w.Warnings = append(w.Warnings, fmt.Sprintf("Hujan lebat %.0f mm", day.Precipitation))
		maxRisk = highest(maxRisk, RiskOrange)
	}

	if day.WindspeedMax >= ThresholdWindWarning {
		w.Warnings = append(w.Warnings, fmt.Sprintf("Angin kencang %.0f km/h", day.WindspeedMax))
		maxRisk = highest(maxRisk, RiskWarning)
	}

	if day.TempMax >= ThresholdTempHot {
		w.Warnings = append(w.Warnings, fmt.Sprintf("Suhu panas ekstrem %.1f°C", day.TempMax))
		maxRisk = highest(maxRisk, RiskWarning)
	} else if day.TempMax > 0 && day.TempMax <= ThresholdTempCold {
		w.Warnings = append(w.Warnings, fmt.Sprintf("Suhu dingin ekstrem %.1f°C", day.TempMax))
		maxRisk = highest(maxRisk, RiskWarning)
	}

	w.RiskLevel = maxRisk
	return w
}

func highest(a, b RiskLevel) RiskLevel {
	order := map[RiskLevel]int{
		RiskNormal: 0, RiskWarning: 1, RiskOrange: 2, RiskRed: 3,
	}
	if order[b] > order[a] {
		return b
	}
	return a
}