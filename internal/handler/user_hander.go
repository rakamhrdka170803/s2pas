package handler

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	users *service.UserService
}

func NewUserHandler(s *service.UserService) *UserHandler {
	return &UserHandler{users: s}
}

func (h *UserHandler) List(c *gin.Context) {
	data, err := h.users.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *UserHandler) Create(c *gin.Context) {
	var body struct {
		Username string      `json:"username"`
		Name     string      `json:"name"`
		Password string      `json:"password"`
		Role     models.Role `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	id, err := h.users.Create(body.Username, body.Name, body.Password, body.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}
