package handler

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/service"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	products *service.ProductService
}

func NewProductHandler(s *service.ProductService) *ProductHandler {
	return &ProductHandler{products: s}
}

// ==== DTO ====

type createProductRequest struct {
	Title         string                `json:"title" binding:"required"`
	CategoryID    int64                 `json:"categoryId" binding:"required"`
	Blocks        []models.ContentBlock `json:"blocks" binding:"required"`
	IsBreaking    bool                  `json:"isBreaking"`
	BreakingTitle string                `json:"breakingTitle"`
}

type createCategoryRequest struct {
	Kind           string `json:"kind" binding:"required"`         // product / script
	Category       string `json:"category" binding:"required"`     // level 1
	SubCategory    string `json:"sub_category" binding:"required"` // level 2
	DetailCategory string `json:"detail_category"`                 // level 3 (opsional)
}

// ==== LIST ====

func (h *ProductHandler) ListProducts(c *gin.Context) {
	q := c.Query("q")

	var catID *int64
	if c.Query("categoryId") != "" {
		id, _ := strconv.ParseInt(c.Query("categoryId"), 10, 64)
		catID = &id
	}

	data, err := h.products.List(models.ContentKindProduct, q, catID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *ProductHandler) ListScripts(c *gin.Context) {
	q := c.Query("q")

	var catID *int64
	if c.Query("categoryId") != "" {
		id, _ := strconv.ParseInt(c.Query("categoryId"), 10, 64)
		catID = &id
	}

	data, err := h.products.List(models.ContentKindScript, q, catID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *ProductHandler) List(c *gin.Context) {
	h.ListProducts(c)
}

// ==== DETAIL ====

func (h *ProductHandler) GetByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	p, err := h.products.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *ProductHandler) GetProductBySlug(c *gin.Context) {
	slug := c.Param("slug")
	p, err := h.products.GetBySlug(models.ContentKindProduct, slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *ProductHandler) GetScriptBySlug(c *gin.Context) {
	slug := c.Param("slug")
	p, err := h.products.GetBySlug(models.ContentKindScript, slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

// ==== CREATE PRODUCT / SCRIPT ====

func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var body createProductRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	id, slug, err := h.products.Create(
		models.ContentKindProduct,
		body.Title,
		body.CategoryID,
		body.Blocks,
		body.IsBreaking,
		body.BreakingTitle,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "slug": slug})
}

func (h *ProductHandler) CreateScript(c *gin.Context) {
	var body createProductRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	id, slug, err := h.products.Create(
		models.ContentKindScript,
		body.Title,
		body.CategoryID,
		body.Blocks,
		body.IsBreaking,
		body.BreakingTitle,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "slug": slug})
}

// ==== CATEGORY MASTER ====

func (h *ProductHandler) CreateCategory(c *gin.Context) {
	var body createCategoryRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	var kind models.ContentKind
	switch strings.ToLower(body.Kind) {
	case "script":
		kind = models.ContentKindScript
	default:
		kind = models.ContentKindProduct
	}

	id, err := h.products.CreateCategory(kind, body.Category, body.SubCategory, body.DetailCategory)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *ProductHandler) ListCategories(c *gin.Context) {
	kindParam := c.Query("kind")
	var kind models.ContentKind
	switch kindParam {
	case "script":
		kind = models.ContentKindScript
	default:
		kind = models.ContentKindProduct
	}

	cats, err := h.products.ListCategories(kind)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cats)
}

// ==== SEARCH (Produk kiri, Script kanan) ====

func (h *ProductHandler) Search(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "q is required"})
		return
	}

	// kategori tidak difilter ⇒ kirim nil
	products, err1 := h.products.List(models.ContentKindProduct, q, nil)
	scripts, err2 := h.products.List(models.ContentKindScript, q, nil)

	if err1 != nil || err2 != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"scripts":  scripts,
	})
}

// ==== BREAKING NEWS ====

func (h *ProductHandler) ListBreakingNews(c *gin.Context) {
	data, err := h.products.ListActiveBreakingNews()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed list breaking news"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *ProductHandler) ListAllBreakingNews(c *gin.Context) {
	data, err := h.products.ListAllBreakingNews()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed list breaking news"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *ProductHandler) DeleteBreakingNews(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.products.DeleteBreakingNews(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed delete breaking news"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
