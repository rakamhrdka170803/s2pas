package service

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/repository"
)

type CategoryService struct {
	repo repository.CategoryRepository
}

func NewCategoryService(r repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: r}
}

func (s *CategoryService) Create(c *models.Category) (int64, error) {
	return s.repo.Create(c)
}

func (s *CategoryService) Update(c *models.Category) error {
	return s.repo.Update(c)
}

func (s *CategoryService) Delete(id int64) error {
	return s.repo.Delete(id)
}

func (s *CategoryService) GetByID(id int64) (*models.Category, error) {
	return s.repo.GetByID(id)
}

func (s *CategoryService) List(kind models.ContentKind) ([]*models.Category, error) {
	return s.repo.ListByKind(kind)
}
