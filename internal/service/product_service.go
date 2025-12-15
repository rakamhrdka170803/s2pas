package service

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/repository"
	"database/sql"
	"fmt"
	"regexp"
	"strings"
)

type ProductService struct {
	productRepo      repository.ProductRepository
	categoryRepo     repository.CategoryRepository
	categorySvc      *CategoryService
	breakingNewsRepo repository.BreakingNewsRepository
}

func NewProductService(
	productRepo repository.ProductRepository,
	categoryRepo repository.CategoryRepository,
	breakingNewsRepo repository.BreakingNewsRepository,
) *ProductService {
	catSvc := NewCategoryService(categoryRepo)
	return &ProductService{
		productRepo:      productRepo,
		categoryRepo:     categoryRepo,
		categorySvc:      catSvc,
		breakingNewsRepo: breakingNewsRepo,
	}
}

var slugRegexNonAlnum = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(title string) string {
	s := strings.ToLower(strings.TrimSpace(title))
	s = slugRegexNonAlnum.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "item"
	}
	return s
}

func (s *ProductService) generateUniqueSlug(kind models.ContentKind, title string, selfID *int64) string {
	base := slugify(title)
	slug := base
	i := 2
	for {
		existing, err := s.productRepo.GetBySlug(kind, slug)
		if err != nil {
			if err == sql.ErrNoRows {
				return slug
			}
			return slug
		}
		if selfID != nil && existing.ID == *selfID {
			return slug
		}
		slug = fmt.Sprintf("%s-%d", base, i)
		i++
	}
}

func (s *ProductService) List(kind models.ContentKind, q string, categoryID *int64) ([]*models.Product, error) {
	list, err := s.productRepo.List(kind, q, categoryID, 0, 0)
	if err != nil {
		return nil, err
	}
	// enrich category_path (simple, OK untuk sekarang)
	for _, p := range list {
		path, err := s.categorySvc.BuildPathString(p.CategoryID)
		if err == nil {
			p.CategoryPath = path
		}
	}
	return list, nil
}

func (s *ProductService) GetByID(id int64) (*models.Product, error) {
	p, err := s.productRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	path, err := s.categorySvc.BuildPathString(p.CategoryID)
	if err == nil {
		p.CategoryPath = path
	}
	return p, nil
}

func (s *ProductService) GetBySlug(kind models.ContentKind, slug string) (*models.Product, error) {
	p, err := s.productRepo.GetBySlug(kind, slug)
	if err != nil {
		return nil, err
	}
	path, err := s.categorySvc.BuildPathString(p.CategoryID)
	if err == nil {
		p.CategoryPath = path
	}
	return p, nil
}

func (s *ProductService) Create(
	kind models.ContentKind,
	title string,
	categoryID int64,
	blocks []models.ContentBlock,
	isBreaking bool,
	breakingTitle string,
) (int64, string, error) {
	cat, err := s.categoryRepo.GetByID(categoryID)
	if err != nil {
		return 0, "", err
	}
	if cat.Kind != kind {
		return 0, "", fmt.Errorf("kategori tidak sesuai dengan jenis (product/script)")
	}

	slug := s.generateUniqueSlug(kind, title, nil)

	p := &models.Product{
		Kind:       kind,
		Slug:       slug,
		Title:      strings.TrimSpace(title),
		CategoryID: categoryID,
		Blocks:     blocks,
	}
	id, err := s.productRepo.Create(p)
	if err != nil {
		return 0, "", err
	}

	if isBreaking {
		t := strings.TrimSpace(breakingTitle)
		if t == "" {
			t = p.Title
		}
		b := &models.BreakingNews{
			Kind:      kind,
			ProductID: id,
			Title:     t,
			IsActive:  true,
		}
		_, _ = s.breakingNewsRepo.Create(b)
	}

	return id, slug, nil
}

func (s *ProductService) Update(
	id int64,
	kind models.ContentKind,
	title string,
	categoryID int64,
	blocks []models.ContentBlock,
) (string, error) {
	cat, err := s.categoryRepo.GetByID(categoryID)
	if err != nil {
		return "", err
	}
	if cat.Kind != kind {
		return "", fmt.Errorf("kategori tidak sesuai dengan jenis (product/script)")
	}

	self := id
	slug := s.generateUniqueSlug(kind, title, &self)

	p := &models.Product{
		ID:         id,
		Kind:       kind,
		Slug:       slug,
		Title:      strings.TrimSpace(title),
		CategoryID: categoryID,
		Blocks:     blocks,
	}
	if err := s.productRepo.Update(p); err != nil {
		return "", err
	}
	return slug, nil
}

func (s *ProductService) Delete(id int64) error {
	return s.productRepo.Delete(id)
}

// Breaking News
func (s *ProductService) ListActiveBreakingNews() ([]*models.BreakingNews, error) {
	return s.breakingNewsRepo.ListActive()
}
func (s *ProductService) ListAllBreakingNews() ([]*models.BreakingNews, error) {
	return s.breakingNewsRepo.ListAll()
}
func (s *ProductService) DeleteBreakingNews(id int64) error {
	return s.breakingNewsRepo.Delete(id)
}
