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

type createCategoryRequest struct {
	Kind     string `json:"kind" binding:"required"` // product/script
	Name     string `json:"name" binding:"required"`
	ParentID *int64 `json:"parent_id"`
}

// GET /categories?kind=product&parentId=...
func (h *CategoryHandler) List(c *gin.Context) {
	kindParam := c.Query("kind")
	kind := models.ContentKindProduct
	if kindParam == "script" {
		kind = models.ContentKindScript
	}

	var parentID *int64
	if p := c.Query("parentId"); p != "" {
		id, err := strconv.ParseInt(p, 10, 64)
		if err == nil {
			parentID = &id
		}
	}

	list, err := h.svc.ListByParent(kind, parentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

// GET /categories/path/:id  -> "A / B / C"
func (h *CategoryHandler) GetPath(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	path, err := h.svc.BuildPathString(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"path": path})
}

// POST /admin/categories
func (h *CategoryHandler) Create(c *gin.Context) {
	var body createCategoryRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	kind := models.ContentKindProduct
	if body.Kind == "script" {
		kind = models.ContentKindScript
	}

	id, err := h.svc.Create(kind, body.Name, body.ParentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// DELETE /admin/categories/:id
func (h *CategoryHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
