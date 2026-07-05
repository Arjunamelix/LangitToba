package repository

import (
	"langittoba/backend/internal/model"
	"gorm.io/gorm"
)

type LocationRepository struct {
	db *gorm.DB
}

func NewLocationRepository(db *gorm.DB) *LocationRepository {
	return &LocationRepository{db: db}
}

// GetAll — ambil semua lokasi aktif, optional filter by tahap
func (r *LocationRepository) GetAll(tahap *int) ([]model.Location, error) {
	var locations []model.Location

	query := r.db.Where("is_active = ?", true)
	if tahap != nil {
		query = query.Where("tahap <= ?", *tahap)
	}

	err := query.Order("kabupaten ASC, label ASC").Find(&locations).Error
	return locations, err
}

// GetByKey — ambil satu lokasi by key string
func (r *LocationRepository) GetByKey(key string) (*model.Location, error) {
	var loc model.Location
	err := r.db.Where("key = ? AND is_active = ?", key, true).First(&loc).Error
	if err != nil {
		return nil, err
	}
	return &loc, nil
}

// Create — insert lokasi baru
func (r *LocationRepository) Create(loc *model.Location) error {
	return r.db.Create(loc).Error
}

// Upsert — insert atau update by key (untuk seed script)
func (r *LocationRepository) Upsert(loc *model.Location) error {
	return r.db.
		Where(model.Location{Key: loc.Key}).
		Assign(model.Location{
			Label:      loc.Label,
			Lat:        loc.Lat,
			Lon:        loc.Lon,
			Kabupaten:  loc.Kabupaten,
			Tahap:      loc.Tahap,
			IsLakeside: loc.IsLakeside,
			IsActive:   loc.IsActive,
		}).
		FirstOrCreate(loc).Error
}

// CountActive — untuk health check / logging
func (r *LocationRepository) CountActive() (int64, error) {
	var count int64
	err := r.db.Model(&model.Location{}).Where("is_active = ?", true).Count(&count).Error
	return count, err
}