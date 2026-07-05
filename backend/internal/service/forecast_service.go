package service

import (
	"fmt"
	"langittoba/backend/internal/model"
	"langittoba/backend/internal/repository"
	"langittoba/backend/pkg/httpclient"
)

type ForecastService struct {
	locationRepo    *repository.LocationRepository
	inferenceClient *httpclient.InferenceClient
}

func NewForecastService(
	locationRepo *repository.LocationRepository,
	inferenceClient *httpclient.InferenceClient,
) *ForecastService {
	return &ForecastService{
		locationRepo:    locationRepo,
		inferenceClient: inferenceClient,
	}
}

// GetForecast — prediksi N hari untuk satu lokasi
func (s *ForecastService) GetForecast(locationKey string, days int) (*model.ForecastResponse, error) {
	if days < 1 || days > 14 {
		return nil, fmt.Errorf("days harus antara 1-14, got %d", days)
	}
	_, err := s.locationRepo.GetByKey(locationKey)
	if err != nil {
		return nil, fmt.Errorf("lokasi '%s' tidak ditemukan", locationKey)
	}
	result, err := s.inferenceClient.Predict(locationKey, days)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil prediksi: %w", err)
	}
	return result, nil
}

// GetMultiForecast — prediksi untuk beberapa lokasi sekaligus
func (s *ForecastService) GetMultiForecast(locationKeys []string, days int) ([]*model.ForecastResponse, error) {
	if days < 1 || days > 14 {
		return nil, fmt.Errorf("days harus antara 1-14")
	}
	results := make([]*model.ForecastResponse, 0, len(locationKeys))
	for _, key := range locationKeys {
		result, err := s.inferenceClient.Predict(key, days)
		if err != nil {
			continue // skip lokasi yang gagal
		}
		results = append(results, result)
	}
	return results, nil
}