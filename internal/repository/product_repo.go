package repository

import (
	"cc-helper-backend/internal/models"
	"database/sql"
	"encoding/json"
	"strconv"
)

type ProductRepository interface {
	GetByID(id int64) (*models.Product, error)
	GetBySlug(kind models.ContentKind, slug string) (*models.Product, error)
	List(kind models.ContentKind, q, category string) ([]*models.Product, error)
	Create(p *models.Product) (int64, error)
	Update(p *models.Product) error
	Delete(id int64) error
	ListCategories(kind models.ContentKind) ([]string, error)
}

type productRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) scanProductRow(row *sql.Row) (*models.Product, error) {
	var (
		p      models.Product
		blocks []byte
	)
	err := row.Scan(
		&p.ID,
		&p.Kind,
		&p.Slug,
		&p.Title,
		&p.Category,
		&blocks,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(blocks, &p.Blocks)
	return &p, nil
}

func (r *productRepository) GetByID(id int64) (*models.Product, error) {
	row := r.db.QueryRow(`
        SELECT id, kind, slug, title, category, blocks, created_at, updated_at
        FROM products
        WHERE id = $1
    `, id)
	return r.scanProductRow(row)
}

func (r *productRepository) GetBySlug(kind models.ContentKind, slug string) (*models.Product, error) {
	row := r.db.QueryRow(`
        SELECT id, kind, slug, title, category, blocks, created_at, updated_at
        FROM products
        WHERE kind = $1 AND slug = $2
    `, kind, slug)
	return r.scanProductRow(row)
}

func (r *productRepository) List(kind models.ContentKind, q, category string) ([]*models.Product, error) {
	base := `
        SELECT id, kind, slug, title, category, blocks, created_at, updated_at
        FROM products
        WHERE kind = $1
    `
	args := []interface{}{kind}
	argIdx := 2

	if q != "" {
		base += " AND (title ILIKE $" + strconv.Itoa(argIdx) +
			" OR category ILIKE $" + strconv.Itoa(argIdx) +
			" OR blocks::text ILIKE $" + strconv.Itoa(argIdx) + ")"
		args = append(args, "%"+q+"%")
		argIdx++
	}

	if category != "" {
		base += " AND category = $" + strconv.Itoa(argIdx)
		args = append(args, category)
		argIdx++
	}

	base += " ORDER BY title"

	rows, err := r.db.Query(base, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*models.Product
	for rows.Next() {
		var p models.Product
		var blocks []byte
		if err := rows.Scan(&p.ID, &p.Kind, &p.Slug, &p.Title, &p.Category, &blocks, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(blocks, &p.Blocks)
		result = append(result, &p)
	}
	return result, nil
}

func (r *productRepository) Create(p *models.Product) (int64, error) {
	blocks, _ := json.Marshal(p.Blocks)
	var id int64
	err := r.db.QueryRow(`
        INSERT INTO products (kind, slug, title, category, blocks)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id
    `, p.Kind, p.Slug, p.Title, p.Category, blocks).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *productRepository) Update(p *models.Product) error {
	blocks, _ := json.Marshal(p.Blocks)
	_, err := r.db.Exec(`
        UPDATE products
        SET kind = $1,
            slug = $2,
            title = $3,
            category = $4,
            blocks = $5,
            updated_at = NOW()
        WHERE id = $6
    `, p.Kind, p.Slug, p.Title, p.Category, blocks, p.ID)
	return err
}

func (r *productRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM products WHERE id = $1`, id)
	return err
}

func (r *productRepository) ListCategories(kind models.ContentKind) ([]string, error) {
	rows, err := r.db.Query(`
        SELECT DISTINCT category
        FROM products
        WHERE kind = $1
        ORDER BY category
    `, kind)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []string
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}
