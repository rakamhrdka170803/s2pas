package handler

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	svc *service.CategoryService
}

func NewCategoryHandler(s *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: s}
}

type categoryRequest struct {
	Kind           string  `json:"kind" binding:"required"` // "product"/"script"
	Category       string  `json:"category" binding:"required"`
	SubCategory    string  `json:"sub_category" binding:"required"` // <-- ganti
	DetailCategory *string `json:"detail_category"`                 // <-- ganti
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var body categoryRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	k := models.ContentKindProduct
	if body.Kind == "script" {
		k = models.ContentKindScript
	}

	id, err := h.svc.Create(&models.Category{
		Kind:           k,
		Category:       body.Category,
		SubCategory:    body.SubCategory,
		DetailCategory: body.DetailCategory,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var body categoryRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	existing, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	existing.Category = body.Category
	existing.SubCategory = body.SubCategory
	existing.DetailCategory = body.DetailCategory

	if err := h.svc.Update(existing); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *CategoryHandler) List(c *gin.Context) {
	kindParam := c.Query("kind")
	var kind models.ContentKind
	switch kindParam {
	case "script":
		kind = models.ContentKindScript
	default:
		kind = models.ContentKindProduct
	}
	list, err := h.svc.List(kind)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}
