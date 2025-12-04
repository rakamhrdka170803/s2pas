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
	categoryRepo := repository.NewCategoryRepository(database)
	breakingNewsRepo := repository.NewBreakingNewsRepository(database)

	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	userService := service.NewUserService(userRepo)
	productService := service.NewProductService(productRepo, categoryRepo, breakingNewsRepo)

	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	productHandler := handler.NewProductHandler(productService)
	uploadHandler := handler.NewUploadHandler(cfg.UploadDir, cfg.BaseURL)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.Static("/static", cfg.UploadDir)

	api := r.Group("/api")
	{
		api.POST("/auth/login", authHandler.Login)

		auth := api.Group("/")
		auth.Use(middleware.Auth(authService))
		{
			auth.GET("/auth/me", authHandler.Me)

			// admin
			admin := auth.Group("/admin")
			admin.Use(middleware.RequireRole("admin"))
			{
				admin.GET("/users", userHandler.List)
				admin.POST("/users", userHandler.Create)

				// category master
				admin.POST("/categories", productHandler.CreateCategory)
				admin.DELETE("/categories/:id", productHandler.DeleteCategory)

				// create product / script
				admin.POST("/products", productHandler.CreateProduct)
				admin.POST("/scripts", productHandler.CreateScript)

				// ⬇⬇⬇ baru: delete product/script by ID
				admin.DELETE("/products/:id", productHandler.DeleteProduct)

				// breaking news admin
				admin.GET("/breaking-news", productHandler.ListAllBreakingNews)
				admin.DELETE("/breaking-news/:id", productHandler.DeleteBreakingNews)
			}

			// umum (agent & admin)
			auth.GET("/products", productHandler.ListProducts)
			auth.GET("/scripts", productHandler.ListScripts)

			auth.GET("/products/:id", productHandler.GetByID)
			auth.GET("/products/slug/:slug", productHandler.GetProductBySlug)
			auth.GET("/scripts/slug/:slug", productHandler.GetScriptBySlug)

			auth.GET("/categories", productHandler.ListCategories)

			auth.GET("/search", productHandler.Search)

			// breaking news untuk agent (ticker)
			auth.GET("/breaking-news", productHandler.ListBreakingNews)

			// upload gambar
			auth.POST("/upload", uploadHandler.Upload)
		}
	}

	log.Println("server running on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
