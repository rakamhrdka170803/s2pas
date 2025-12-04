package service

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/repository"
)

type BreakingNewsService struct {
	repo repository.BreakingNewsRepository
}

func NewBreakingNewsService(r repository.BreakingNewsRepository) *BreakingNewsService {
	return &BreakingNewsService{repo: r}
}

func (s *BreakingNewsService) Create(kind models.ContentKind, productID int64, title string) (int64, error) {
	b := &models.BreakingNews{
		Kind:      kind,
		ProductID: productID,
		Title:     title,
		IsActive:  true,
	}
	return s.repo.Create(b)
}

func (s *BreakingNewsService) Delete(id int64) error {
	return s.repo.Delete(id)
}

func (s *BreakingNewsService) ListActive() ([]*models.BreakingNews, error) {
	return s.repo.ListActive()
}

func (s *BreakingNewsService) ListAll() ([]*models.BreakingNews, error) {
	return s.repo.ListAll()
}
