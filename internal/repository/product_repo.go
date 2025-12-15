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
	List(kind models.ContentKind, q string, categoryID *int64, limit, offset int) ([]*models.Product, error)

	Create(p *models.Product) (int64, error)
	Update(p *models.Product) error
	Delete(id int64) error
}

type productRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) scan(row scanner) (*models.Product, error) {
	var (
		p      models.Product
		blocks []byte
	)
	if err := row.Scan(
		&p.ID, &p.Kind, &p.Slug, &p.Title, &p.CategoryID,
		&blocks, &p.CreatedAt, &p.UpdatedAt,
	); err != nil {
		return nil, err
	}
	_ = json.Unmarshal(blocks, &p.Blocks)
	return &p, nil
}

type scanner interface {
	Scan(dest ...any) error
}

func (r *productRepository) GetByID(id int64) (*models.Product, error) {
	row := r.db.QueryRow(`
		SELECT id, kind, slug, title, category_id, blocks, created_at, updated_at
		FROM products
		WHERE id = $1
	`, id)
	return r.scan(row)
}

func (r *productRepository) GetBySlug(kind models.ContentKind, slug string) (*models.Product, error) {
	row := r.db.QueryRow(`
		SELECT id, kind, slug, title, category_id, blocks, created_at, updated_at
		FROM products
		WHERE kind = $1 AND slug = $2
	`, kind, slug)
	return r.scan(row)
}

func (r *productRepository) List(kind models.ContentKind, q string, categoryID *int64, limit, offset int) ([]*models.Product, error) {
	base := `
		SELECT id, kind, slug, title, category_id, blocks, created_at, updated_at
		FROM products
		WHERE kind = $1
	`
	args := []any{kind}
	argIdx := 2

	if q != "" {
		base += " AND (title ILIKE $" + strconv.Itoa(argIdx) + " OR blocks::text ILIKE $" + strconv.Itoa(argIdx) + ")"
		args = append(args, "%"+q+"%")
		argIdx++
	}

	if categoryID != nil {
		base += " AND category_id = $" + strconv.Itoa(argIdx)
		args = append(args, *categoryID)
		argIdx++
	}

	base += " ORDER BY lower(title)"

	if limit > 0 {
		base += " LIMIT $" + strconv.Itoa(argIdx)
		args = append(args, limit)
		argIdx++
	}
	if offset > 0 {
		base += " OFFSET $" + strconv.Itoa(argIdx)
		args = append(args, offset)
		argIdx++
	}

	rows, err := r.db.Query(base, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.Product
	for rows.Next() {
		var (
			p      models.Product
			blocks []byte
		)
		if err := rows.Scan(&p.ID, &p.Kind, &p.Slug, &p.Title, &p.CategoryID, &blocks, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(blocks, &p.Blocks)
		list = append(list, &p)
	}
	return list, nil
}

func (r *productRepository) Create(p *models.Product) (int64, error) {
	blocks, _ := json.Marshal(p.Blocks)
	var id int64
	err := r.db.QueryRow(`
		INSERT INTO products (kind, slug, title, category_id, blocks)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id
	`, p.Kind, p.Slug, p.Title, p.CategoryID, blocks).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *productRepository) Update(p *models.Product) error {
	blocks, _ := json.Marshal(p.Blocks)
	_, err := r.db.Exec(`
		UPDATE products
		SET slug = $1,
			title = $2,
			category_id = $3,
			blocks = $4,
			updated_at = NOW()
		WHERE id = $5 AND kind = $6
	`, p.Slug, p.Title, p.CategoryID, blocks, p.ID, p.Kind)
	return err
}

func (r *productRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM products WHERE id = $1`, id)
	return err
}
