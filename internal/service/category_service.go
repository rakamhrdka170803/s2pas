package service

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/repository"
	"fmt"
	"strings"
)

type CategoryService struct {
	repo repository.CategoryRepository
}

func NewCategoryService(r repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: r}
}

func normalizeName(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return s
	}
	// rapihin spasi doang, kapitalisasi optional (biarin admin)
	return s
}

func (s *CategoryService) Create(kind models.ContentKind, name string, parentID *int64) (int64, error) {
	name = normalizeName(name)
	if name == "" {
		return 0, fmt.Errorf("name is required")
	}
	c := &models.Category{Kind: kind, Name: name, ParentID: parentID}
	return s.repo.Create(c)
}

func (s *CategoryService) Delete(id int64) error {
	return s.repo.Delete(id)
}

func (s *CategoryService) GetByID(id int64) (*models.Category, error) {
	return s.repo.GetByID(id)
}

func (s *CategoryService) ListByParent(kind models.ContentKind, parentID *int64) ([]*models.Category, error) {
	return s.repo.ListByParent(kind, parentID)
}

// build path string: root / ... / leaf
func (s *CategoryService) BuildPathString(categoryID int64) (string, error) {
	cur, err := s.repo.GetByID(categoryID)
	if err != nil {
		return "", err
	}
	names := []string{cur.Name}
	for cur.ParentID != nil {
		parent, err := s.repo.GetByID(*cur.ParentID)
		if err != nil {
			return "", err
		}
		names = append([]string{parent.Name}, names...)
		cur = parent
	}
	return strings.Join(names, " / "), nil
}
