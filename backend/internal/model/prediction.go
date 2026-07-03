package model

// Response structs untuk API

type ForecastDay struct {
	Date          string   `json:"date"`
	TempMax       float64  `json:"temp_max"`
	TempMin       float64  `json:"temp_min"`
	Precipitation float64  `json:"precipitation"`
	WindspeedMax  float64  `json:"windspeed_max"`
	WeatherCode   int      `json:"weathercode"`
	RiskLevel     string   `json:"risk_level"`
	Warnings      []string `json:"warnings"`
}

type ForecastResponse struct {
	Location      string        `json:"location"`
	LocationLabel string        `json:"location_label"`
	Lat           float64       `json:"lat"`
	Lon           float64       `json:"lon"`
	ForecastDays  int           `json:"forecast_days"`
	GeneratedAt   string        `json:"generated_at"`
	Forecast      []ForecastDay `json:"forecast"`
}

type LocationInfo struct {
	Key   string  `json:"key"`
	Label string  `json:"label"`
	Lat   float64 `json:"lat"`
	Lon   float64 `json:"lon"`
}