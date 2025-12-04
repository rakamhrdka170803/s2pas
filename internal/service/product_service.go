package service

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/repository"
	"regexp"
	"strings"
)

type ProductService struct {
	repo repository.ProductRepository
}

func NewProductService(r repository.ProductRepository) *ProductService {
	return &ProductService{repo: r}
}

// util: slugify judul → bjb-t-samsat
var slugRegexNonAlnum = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(title string) string {
	s := strings.ToLower(title)
	s = slugRegexNonAlnum.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "item"
	}
	return s
}

func (s *ProductService) List(kind models.ContentKind, q, category string) ([]*models.Product, error) {
	return s.repo.List(kind, q, category)
}

func (s *ProductService) ListCategories(kind models.ContentKind) ([]string, error) {
	return s.repo.ListCategories(kind)
}

func (s *ProductService) GetByID(id int64) (*models.Product, error) {
	return s.repo.GetByID(id)
}

func (s *ProductService) GetBySlug(kind models.ContentKind, slug string) (*models.Product, error) {
	return s.repo.GetBySlug(kind, slug)
}

// Create: admin buat product / script
func (s *ProductService) Create(kind models.ContentKind, title, category string, blocks []models.ContentBlock) (int64, string, error) {
	p := &models.Product{
		Kind:     kind,
		Slug:     slugify(title),
		Title:    title,
		Category: category,
		Blocks:   blocks,
	}
	id, err := s.repo.Create(p)
	if err != nil {
		return 0, "", err
	}
	return id, p.Slug, nil
}

func (s *ProductService) Update(p *models.Product) error {
	// regenerate slug jika title diubah
	p.Slug = slugify(p.Title)
	return s.repo.Update(p)
}

func (s *ProductService) Delete(id int64) error {
	return s.repo.Delete(id)
}
