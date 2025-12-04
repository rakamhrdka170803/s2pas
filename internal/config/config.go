package config

import (
    "log"
    "os"

    "github.com/joho/godotenv"
)

type Config struct {
    DatabaseURL string
    JWTSecret   string
    UploadDir   string
    BaseURL     string
}

func Load() *Config {
    _ = godotenv.Load() // boleh gagal kalau tidak ada .env

    cfg := &Config{
        DatabaseURL: getEnv("DATABASE_URL", ""),
        JWTSecret:   getEnv("JWT_SECRET", "CHANGE_ME"),
        UploadDir:   getEnv("UPLOAD_DIR", "uploads"),
        BaseURL:     getEnv("BASE_URL", "http://localhost:8080"),
    }

    if cfg.DatabaseURL == "" {
        log.Fatal("DATABASE_URL must be set")
    }
    return cfg
}

func getEnv(key, def string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return def
}
