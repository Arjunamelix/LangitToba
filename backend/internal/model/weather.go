package model

import "time"

// RawWeather — data cuaca harian dari Open-Meteo
type RawWeather struct {
	ID           uint      `gorm:"primaryKey;autoIncrement"`
	Location     string    `gorm:"index;not null"`
	Date         time.Time `gorm:"index;not null"`
	TempMax      float64
	TempMin      float64
	TempMean     float64
	Precipitation float64
	WindspeedMax float64
	WindDirection float64
	WeatherCode  int
	CreatedAt    time.Time
}

// Prediction — hasil prediksi LSTM
type Prediction struct {
	ID            uint      `gorm:"primaryKey;autoIncrement"`
	Location      string    `gorm:"index;not null"`
	PredictedDate time.Time `gorm:"index;not null"`
	GeneratedAt   time.Time `gorm:"not null"`
	TempMax       float64
	TempMin       float64
	Precipitation float64
	WindspeedMax  float64
	WeatherCode   int
	RiskLevel     string
	Warnings      string    // JSON array string
	ModelVersion  string
}

// EarlyWarning — log peringatan dini
type EarlyWarning struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"`
	Location  string    `gorm:"index;not null"`
	Date      time.Time `gorm:"index;not null"`
	Level     string    // normal, sedang, tinggi, sangat_tinggi
	Type      string    // rain, wind, temp
	Message   string
	IsActive  bool
	CreatedAt time.Time
}