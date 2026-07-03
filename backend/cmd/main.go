package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"langittoba/backend/internal/handler"
	"langittoba/backend/pkg/httpclient"
)

func main() {
	// Load .env
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using defaults")
	}

	// Config
	inferenceURL := getEnv("INFERENCE_URL", "http://127.0.0.1:8000")
	port         := getEnv("BACKEND_PORT", "9000")

	// Inference client
	inferenceClient := httpclient.NewInferenceClient(inferenceURL)

	// Cek koneksi ke FastAPI
	if inferenceClient.HealthCheck() {
		log.Println("✓ Connected to FastAPI inference service")
	} else {
		log.Println(" FastAPI inference service not reachable — pastikan sudah running")
	}

	// Gin router
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))

	// Handlers
	forecastHandler := handler.NewForecastHandler(inferenceClient)
	warningHandler  := handler.NewWarningHandler(inferenceClient)
	climateHandler  := handler.NewClimateHandler()

	// Routes
	api := r.Group("/api")
	{
		// Health
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "service": "LangitToba Backend"})
		})

		// Forecast
		api.GET("/forecast",  forecastHandler.GetForecast)
		api.GET("/locations", forecastHandler.GetLocations)

		// Warning
		api.GET("/warnings", warningHandler.GetWarnings)

		// Climate
		api.GET("/climate", climateHandler.GetClimateSummary)
	}

	fmt.Printf("  LangitToba Backend running on port %s\n", port)
	fmt.Printf("  Inference URL: %s\n", inferenceURL)
	fmt.Println("  Endpoints:")
	fmt.Println("     GET /api/health")
	fmt.Println("     GET /api/forecast?location=balige&days=7")
	fmt.Println("     GET /api/locations")
	fmt.Println("     GET /api/warnings")
	fmt.Println("     GET /api/climate?location=Balige (Tobasa)")

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}