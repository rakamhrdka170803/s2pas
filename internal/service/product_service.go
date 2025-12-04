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
	breakingNewsRepo repository.BreakingNewsRepository
}

func NewProductService(
	productRepo repository.ProductRepository,
	categoryRepo repository.CategoryRepository,
	breakingNewsRepo repository.BreakingNewsRepository,
) *ProductService {
	return &ProductService{
		productRepo:      productRepo,
		categoryRepo:     categoryRepo,
		breakingNewsRepo: breakingNewsRepo,
	}
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

func buildCategoryDisplay(c *models.Category) string {
	if c.DetailCategory != nil && *c.DetailCategory != "" {
		return fmt.Sprintf("%s / %s / %s", c.Category, c.SubCategory, *c.DetailCategory)
	}
	return fmt.Sprintf("%s / %s", c.Category, c.SubCategory)
}

// helper kecil buat normalisasi label (Kredit, Promo, dll)
func normalizeLabel(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return s
	}
	s = strings.ToLower(s)
	// kapitalisasi huruf pertama saja
	return strings.ToUpper(s[:1]) + s[1:]
}

// 👇 helper: generate slug unik
func (s *ProductService) generateUniqueSlug(kind models.ContentKind, title string) string {
	base := slugify(title)
	slug := base
	i := 2

	for {
		_, err := s.productRepo.GetBySlug(kind, slug)
		if err != nil {
			if err == sql.ErrNoRows {
				// slug belum dipakai
				return slug
			}
			// error lain → stop, pakai slug sekarang saja
			return slug
		}
		// slug sudah dipakai, coba tambahkan suffix
		slug = fmt.Sprintf("%s-%d", base, i)
		i++
	}
}

func (s *ProductService) List(kind models.ContentKind, q string, categoryID *int64) ([]*models.Product, error) {
	return s.productRepo.List(
		kind,
		q,
		categoryID,
		"",
		"",
		"",
		0,
		0,
	)
}

func (s *ProductService) ListCategories(kind models.ContentKind) ([]*models.Category, error) {
	return s.categoryRepo.ListByKind(kind)
}

func (s *ProductService) GetByID(id int64) (*models.Product, error) {
	return s.productRepo.GetByID(id)
}

func (s *ProductService) GetBySlug(kind models.ContentKind, slug string) (*models.Product, error) {
	return s.productRepo.GetBySlug(kind, slug)
}

// CreateCategory: admin input master category
func (s *ProductService) CreateCategory(kind models.ContentKind, cat, sub, detail string) (int64, error) {
	// normalisasi input
	catTrim := normalizeLabel(cat)
	subTrim := normalizeLabel(sub)
	detailTrim := strings.TrimSpace(detail)

	var detailPtr *string
	if detailTrim != "" {
		d := detailTrim
		detailPtr = &d
	}

	// 1) Cek dulu apakah kombinasi (kind, category, sub_category, detail_category)
	//    sudah pernah ada. Kalau sudah, balikin ERROR supaya front-end tahu.
	existing, err := s.categoryRepo.ListByKind(kind)
	if err != nil {
		return 0, err
	}

	for _, c := range existing {
		sameCategory := strings.EqualFold(c.Category, catTrim)
		sameSub := strings.EqualFold(c.SubCategory, subTrim)

		var sameDetail bool
		if c.DetailCategory == nil && detailPtr == nil {
			sameDetail = true
		} else if c.DetailCategory != nil && detailPtr != nil {
			sameDetail = strings.EqualFold(*c.DetailCategory, *detailPtr)
		} else {
			sameDetail = false
		}

		if sameCategory && sameSub && sameDetail {
			// kombinasi sudah ada → tolak
			return 0, fmt.Errorf("kategori sudah ada (kombinasi sama)")
		}
	}

	// 2) Kalau belum ada, baru INSERT kategori baru
	newCat := &models.Category{
		Kind:           kind,
		Category:       catTrim,
		SubCategory:    subTrim,
		DetailCategory: detailPtr,
	}
	return s.categoryRepo.Create(newCat)
}

// ==== Create Product / Script ====
func (s *ProductService) Create(
	kind models.ContentKind,
	title string,
	categoryID int64,
	blocks []models.ContentBlock,
	isBreaking bool,
	breakingTitle string,
) (int64, string, error) {
	// ambil kategori dulu
	cat, err := s.categoryRepo.GetByID(categoryID)
	if err != nil {
		return 0, "", err
	}
	if cat.Kind != kind {
		return 0, "", fmt.Errorf("kategori tidak sesuai dengan jenis (product/script)")
	}

	categoryDisplay := buildCategoryDisplay(cat)
	slug := s.generateUniqueSlug(kind, title)

	p := &models.Product{
		Kind:       kind,
		Slug:       slug,
		Title:      title,
		CategoryID: categoryID,
		Category:   categoryDisplay, // string gabungan untuk response
		Blocks:     blocks,
	}

	id, err := s.productRepo.Create(p)
	if err != nil {
		return 0, "", err
	}

	// kalau perlu breaking news
	if isBreaking {
		titleBN := strings.TrimSpace(breakingTitle)
		if titleBN == "" {
			titleBN = title // fallback
		}
		b := &models.BreakingNews{
			Kind:      kind,
			ProductID: id,
			Title:     titleBN,
			IsActive:  true,
		}
		if _, err := s.breakingNewsRepo.Create(b); err != nil {
			fmt.Println("failed create breaking_news:", err)
		}
	}

	return id, p.Slug, nil
}

func (s *ProductService) Update(p *models.Product) error {
	p.Slug = slugify(p.Title)
	return s.productRepo.Update(p)
}

func (s *ProductService) Delete(id int64) error {
	return s.productRepo.Delete(id)
}

// ==== Category Delete ====

func (s *ProductService) DeleteCategory(id int64) error {
	return s.categoryRepo.Delete(id)
}

// ==== Breaking News ====

func (s *ProductService) ListActiveBreakingNews() ([]*models.BreakingNews, error) {
	return s.breakingNewsRepo.ListActive()
}

func (s *ProductService) ListAllBreakingNews() ([]*models.BreakingNews, error) {
	return s.breakingNewsRepo.ListAll()
}

func (s *ProductService) DeleteBreakingNews(id int64) error {
	return s.breakingNewsRepo.Delete(id)
}
