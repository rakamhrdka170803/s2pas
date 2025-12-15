package service

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/repository"
	"fmt"
)

type S2Service struct {
	repo        repository.S2NodeRepository
	productRepo repository.ProductRepository
}

func NewS2Service(
	repo repository.S2NodeRepository,
	productRepo repository.ProductRepository,
) *S2Service {
	return &S2Service{repo: repo, productRepo: productRepo}
}

func (s *S2Service) ListByParent(mainStr string, parentID *int64) ([]*models.S2Node, error) {
	var main models.S2MainType
	switch mainStr {
	case "call":
		main = models.S2MainCall
	case "info":
		main = models.S2MainInfo
	case "request":
		main = models.S2MainRequest
	case "complaint":
		main = models.S2MainComplaint
	default:
		return nil, fmt.Errorf("invalid main type")
	}
	return s.repo.ListByParent(main, parentID)
}

func (s *S2Service) CreateNode(n *models.S2Node) (int64, error) {
	return s.repo.Create(n)
}

func (s *S2Service) UpdateNode(n *models.S2Node) error {
	return s.repo.Update(n)
}

func (s *S2Service) DeleteNode(id int64) error {
	return s.repo.Delete(id)
}

func (s *S2Service) GetNode(id int64) (*models.S2Node, error) {
	return s.repo.GetByID(id)
}
