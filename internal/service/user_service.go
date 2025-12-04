package service

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(r repository.UserRepository) *UserService {
	return &UserService{repo: r}
}

func (s *UserService) List() ([]*models.User, error) {
	return s.repo.List()
}

func (s *UserService) Create(username, name, password string, role models.Role) (int64, error) {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	u := &models.User{
		Username:     username,
		Name:         name,
		PasswordHash: string(hash),
		Role:         role,
	}
	return s.repo.Create(u)
}
