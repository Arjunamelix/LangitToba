package model

import "time"

type Location struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Key        string    `gorm:"uniqueIndex;size:50;not null" json:"key"`
	Label      string    `gorm:"size:100;not null" json:"label"`
	Lat        float64   `gorm:"not null" json:"lat"`
	Lon        float64   `gorm:"not null" json:"lon"`
	Kabupaten  *string   `gorm:"size:100" json:"kabupaten,omitempty"`
	Tahap      int       `gorm:"default:1" json:"tahap"`
	IsLakeside bool      `gorm:"default:false" json:"is_lakeside"`
	IsActive   bool      `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
}

func (Location) TableName() string {
	return "locations"
}