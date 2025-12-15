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

	// ===== REPO =====
	userRepo := repository.NewUserRepository(database)
	productRepo := repository.NewProductRepository(database)
	categoryRepo := repository.NewCategoryRepository(database)
	breakingNewsRepo := repository.NewBreakingNewsRepository(database)
	s2NodeRepo := repository.NewS2NodeRepository(database)

	// ===== SERVICE =====
	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	userService := service.NewUserService(userRepo)
	productService := service.NewProductService(productRepo, categoryRepo, breakingNewsRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	s2Service := service.NewS2Service(s2NodeRepo, productRepo)

	// ===== HANDLER =====
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	productHandler := handler.NewProductHandler(productService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	uploadHandler := handler.NewUploadHandler(cfg.UploadDir, cfg.BaseURL)
	s2Handler := handler.NewS2Handler(s2Service)

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

			// ===== ADMIN =====
			admin := auth.Group("/admin")
			admin.Use(middleware.RequireRole("admin"))
			{
				admin.GET("/users", userHandler.List)
				admin.POST("/users", userHandler.Create)

				// Categories tree
				admin.POST("/categories", categoryHandler.Create)
				admin.DELETE("/categories/:id", categoryHandler.Delete)

				// Products / Scripts
				admin.POST("/products", productHandler.CreateProduct)
				admin.PUT("/products/:id", productHandler.UpdateProduct)
				admin.DELETE("/products/:id", productHandler.DeleteContent)

				admin.POST("/scripts", productHandler.CreateScript)
				admin.PUT("/scripts/:id", productHandler.UpdateScript)
				admin.DELETE("/scripts/:id", productHandler.DeleteContent)

				// Breaking news admin
				admin.GET("/breaking-news", productHandler.ListAllBreakingNews)
				admin.DELETE("/breaking-news/:id", productHandler.DeleteBreakingNews)

				// S2PASS ADMIN
				admin.POST("/s2pass/nodes", s2Handler.CreateNode)
				admin.PUT("/s2pass/nodes/:id", s2Handler.UpdateNode)
				admin.DELETE("/s2pass/nodes/:id", s2Handler.DeleteNode)
			}

			// ===== AGENT =====
			auth.GET("/products", productHandler.ListProducts)
			auth.GET("/scripts", productHandler.ListScripts)

			auth.GET("/products/slug/:slug", productHandler.GetProductBySlug)
			auth.GET("/scripts/slug/:slug", productHandler.GetScriptBySlug)

			// categories list by parent + path helper
			auth.GET("/categories", categoryHandler.List)
			auth.GET("/categories/path/:id", categoryHandler.GetPath)

			auth.GET("/search", productHandler.Search)

			// Breaking news
			auth.GET("/breaking-news", productHandler.ListBreakingNews)

			// Upload
			auth.POST("/upload", uploadHandler.Upload)

			// S2PASS agent
			auth.GET("/s2pass/nodes", s2Handler.ListNodes)
		}
	}

	log.Println("server running on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
