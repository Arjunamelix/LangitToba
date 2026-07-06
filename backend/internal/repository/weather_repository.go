package repository

import (
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"langittoba/backend/internal/model"
)

type WeatherRepository struct {
	db *gorm.DB
}

func NewWeatherRepository(db *gorm.DB) *WeatherRepository {
	return &WeatherRepository{db: db}
}

// GetCache ambil cache yang belum expired. Return nil jika tidak ada.
func (r *WeatherRepository) GetCache(locationKey string, days int) (*model.ForecastCache, error) {
	var cache model.ForecastCache
	err := r.db.
		Where("location_key = ? AND days = ? AND expires_at > ?", locationKey, days, time.Now()).
		First(&cache).Error
	if err != nil {
		return nil, err // termasuk gorm.ErrRecordNotFound
	}
	return &cache, nil
}

// SetCache upsert cache dengan TTL. Pakai ON CONFLICT DO UPDATE.
func (r *WeatherRepository) SetCache(locationKey string, days int, result []byte, ttl time.Duration) error {
	cache := model.ForecastCache{
		LocationKey: locationKey,
		Days:        days,
		Result:      result,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(ttl),
	}
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "location_key"}, {Name: "days"}},
		DoUpdates: clause.AssignmentColumns([]string{"result", "created_at", "expires_at"}),
	}).Create(&cache).Error
}

// DeleteExpired hapus cache yang sudah expired (dipanggil scheduler).
func (r *WeatherRepository) DeleteExpired() (int64, error) {
	result := r.db.Where("expires_at <= ?", time.Now()).Delete(&model.ForecastCache{})
	return result.RowsAffected, result.Error
}

// DeleteByKey invalidate cache untuk satu lokasi (semua days).
func (r *WeatherRepository) DeleteByKey(locationKey string) error {
	return r.db.Where("location_key = ?", locationKey).Delete(&model.ForecastCache{}).Error
}