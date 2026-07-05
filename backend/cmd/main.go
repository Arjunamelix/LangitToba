package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"langittoba/backend/internal/handler"
	"langittoba/backend/internal/model"
	"langittoba/backend/internal/repository"
	"langittoba/backend/pkg/httpclient"
)

func main() {
	// Load .env dari root project (satu level di atas /backend)
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using system environment")
	}

	// Config
	inferenceURL := getEnv("INFERENCE_URL", "http://127.0.0.1:8000")
	port         := getEnv("BACKEND_PORT", "9000")

	// -------------------------------------------------------------------------
	// Database
	// -------------------------------------------------------------------------
	db, err := initDB()
	if err != nil {
		log.Fatalf("✗ Gagal koneksi database: %v", err)
	}
	log.Println("✓ Connected to PostgreSQL")

	// Auto-migrate — buat tabel kalau belum ada
	if err := db.AutoMigrate(&model.Location{}); err != nil {
		log.Fatalf("✗ AutoMigrate gagal: %v", err)
	}

	// -------------------------------------------------------------------------
	// Clients & Repositories
	// -------------------------------------------------------------------------
	inferenceClient := httpclient.NewInferenceClient(inferenceURL)
	locationRepo    := repository.NewLocationRepository(db)

	// Cek koneksi ke FastAPI
	if inferenceClient.HealthCheck() {
		log.Println("✓ Connected to FastAPI inference service")
	} else {
		log.Println("⚠ FastAPI inference service not reachable — pastikan sudah running")
	}

	// -------------------------------------------------------------------------
	// Handlers
	// -------------------------------------------------------------------------
	forecastHandler  := handler.NewForecastHandler(inferenceClient)
	locationHandler  := handler.NewLocationHandler(locationRepo)
	warningHandler   := handler.NewWarningHandler(inferenceClient)
	climateHandler   := handler.NewClimateHandler()

	// -------------------------------------------------------------------------
	// Router
	// -------------------------------------------------------------------------
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))

	api := r.Group("/api")
	{
		// Health
		api.GET("/health", func(c *gin.Context) {
			count, _ := locationRepo.CountActive()
			c.JSON(200, gin.H{
				"status":          "ok",
				"service":         "LangitToba Backend",
				"active_locations": count,
			})
		})

		// Forecast
		api.GET("/forecast", forecastHandler.GetForecast)

		// Locations — sekarang DB-driven
		api.GET("/locations",     locationHandler.GetLocations)
		api.GET("/locations/:key", locationHandler.GetLocationByKey)

		// Warning & Climate
		api.GET("/warnings", warningHandler.GetWarnings)
		api.GET("/climate",  climateHandler.GetClimateSummary)
	}

	fmt.Printf("\n🌤  LangitToba Backend running on port %s\n", port)
	fmt.Printf("   Inference URL : %s\n", inferenceURL)
	fmt.Println("   Endpoints     :")
	fmt.Println("      GET /api/health")
	fmt.Println("      GET /api/forecast?location=balige&days=7")
	fmt.Println("      GET /api/locations")
	fmt.Println("      GET /api/locations?tahap=1")
	fmt.Println("      GET /api/locations/:key")
	fmt.Println("      GET /api/warnings")
	fmt.Println("      GET /api/climate?location=Balige (Tobasa)")

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func initDB() (*gorm.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// Bangun DSN dari komponen individual
		host     := getEnv("DB_HOST", "localhost")
		port     := getEnv("DB_PORT", "5432")
		dbname   := getEnv("DB_NAME", "langittoba")
		user     := getEnv("DB_USER", "postgres")
		password := getEnv("DB_PASSWORD", "")
		dsn       = fmt.Sprintf(
			"host=%s port=%s dbname=%s user=%s password=%s sslmode=disable TimeZone=Asia/Jakarta",
			host, port, dbname, user, password,
		)
	}

	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}