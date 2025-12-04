package handler

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/service"
	"net/http"
	"strconv"

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
	Title    string                `json:"title" binding:"required"`
	Category string                `json:"category" binding:"required"`
	Blocks   []models.ContentBlock `json:"blocks" binding:"required"`
}

// ==== LIST ====

func (h *ProductHandler) ListProducts(c *gin.Context) {
	// list khusus kind=product
	q := c.Query("q")
	category := c.Query("category")

	data, err := h.products.List(models.ContentKindProduct, q, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *ProductHandler) ListScripts(c *gin.Context) {
	// list khusus kind=script
	q := c.Query("q")
	category := c.Query("category")

	data, err := h.products.List(models.ContentKindScript, q, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// Untuk kompatibilitas lama: /products (tanpa context) → treat as products
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

// ==== CREATE ====

func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var body createProductRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	id, slug, err := h.products.Create(models.ContentKindProduct, body.Title, body.Category, body.Blocks)
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
	id, slug, err := h.products.Create(models.ContentKindScript, body.Title, body.Category, body.Blocks)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "slug": slug})
}

// ==== CATEGORIES ====

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

	products, err1 := h.products.List(models.ContentKindProduct, q, "")
	scripts, err2 := h.products.List(models.ContentKindScript, q, "")

	if err1 != nil || err2 != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"scripts":  scripts,
	})
}
