package handler

import (
	"cc-helper-backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type BreakingNewsHandler struct {
	svc *service.BreakingNewsService
}

func NewBreakingNewsHandler(s *service.BreakingNewsService) *BreakingNewsHandler {
	return &BreakingNewsHandler{svc: s}
}

type breakingNewsUpdateReq struct {
	Title    string `json:"title" binding:"required"`
	IsActive bool   `json:"isActive"`
}

// List active (untuk agent header running text)
func (h *BreakingNewsHandler) ListActive(c *gin.Context) {
	data, err := h.svc.ListActive()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// List all (admin panel)
func (h *BreakingNewsHandler) ListAll(c *gin.Context) {
	data, err := h.svc.ListAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *BreakingNewsHandler) Update(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "update belum diaktifkan",
	})
}

func (h *BreakingNewsHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
