package handler

import (
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	UploadDir string
	BaseURL   string
}

func NewUploadHandler(uploadDir, baseURL string) *UploadHandler {
	return &UploadHandler{UploadDir: uploadDir, BaseURL: baseURL}
}

func (h *UploadHandler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}

	filename := time.Now().Format("20060102150405") + "_" + file.Filename
	dst := filepath.Join(h.UploadDir, filename)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save"})
		return
	}

	// URL untuk dipakai di front-end & disimpan di blocks.imageUrl
	url := h.BaseURL + "/static/" + filename

	c.JSON(http.StatusOK, gin.H{
		"url": url,
	})
}
