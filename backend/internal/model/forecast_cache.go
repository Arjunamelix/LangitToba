package model

import "time"

type ForecastCache struct {
	ID          int       `gorm:"primaryKey"`
	LocationKey string    `gorm:"column:location_key;uniqueIndex:idx_loc_days"`
	Days        int       `gorm:"column:days;uniqueIndex:idx_loc_days"`
	Result      []byte    `gorm:"column:result;type:jsonb"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime"`
	ExpiresAt   time.Time `gorm:"column:expires_at"`
}

func (ForecastCache) TableName() string { return "forecast_cache" }