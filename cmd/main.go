package main

import (
	"log"
	"os"

	"cc-helper-backend/internal/config"
	"cc-helper-backend/internal/db"
	"cc-helper-backend/internal/handler"
	"cc-helper-backend/internal/middleware"
	"cc-helper-backend/internal/repository"
	"cc-helper-backend/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database := db.New(cfg.DatabaseURL)

	if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
		log.Fatalf("failed to create upload dir: %v", err)
	}

	userRepo := repository.NewUserRepository(database)
	productRepo := repository.NewProductRepository(database)

	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	userService := service.NewUserService(userRepo)
	productService := service.NewProductService(productRepo)

	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	productHandler := handler.NewProductHandler(productService)
	uploadHandler := handler.NewUploadHandler(cfg.UploadDir, cfg.BaseURL)

	r := gin.Default()

	// CORS untuk frontend Vite di 5173
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// serve file upload sebagai static
	r.Static("/static", cfg.UploadDir)

	api := r.Group("/api")
	{
		api.POST("/auth/login", authHandler.Login)

		auth := api.Group("/")
		auth.Use(middleware.Auth(authService))
		{
			auth.GET("/auth/me", authHandler.Me)

			// admin: user & product/script CRUD
			admin := auth.Group("/admin")
			admin.Use(middleware.RequireRole("admin"))
			{
				admin.GET("/users", userHandler.List)
				admin.POST("/users", userHandler.Create)

				// create product / script
				admin.POST("/products", productHandler.CreateProduct)
				admin.POST("/scripts", productHandler.CreateScript)
				// update/delete bisa ditambah nanti
			}

			// umum (agent & admin) - LIST
			auth.GET("/products", productHandler.ListProducts)
			auth.GET("/scripts", productHandler.ListScripts)

			// umum - DETAIL BY ID (opsional, lebih untuk admin / tooling)
			auth.GET("/products/:id", productHandler.GetByID)

			// DETAIL BY SLUG (untuk frontend)
			auth.GET("/products/slug/:slug", productHandler.GetProductBySlug)
			auth.GET("/scripts/slug/:slug", productHandler.GetScriptBySlug)

			// Kategori per jenis
			auth.GET("/categories", productHandler.ListCategories)

			// Search (produk kiri, script kanan)
			auth.GET("/search", productHandler.Search)

			// upload gambar
			auth.POST("/upload", uploadHandler.Upload)
		}
	}

	log.Println("server running on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}

}
