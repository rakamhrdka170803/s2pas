package repository

import (
	"cc-helper-backend/internal/models"
	"database/sql"
)

type BreakingNewsRepository interface {
	Create(b *models.BreakingNews) (int64, error)
	ListActive() ([]*models.BreakingNews, error)
	ListAll() ([]*models.BreakingNews, error)
	Delete(id int64) error
}

type breakingNewsRepository struct {
	db *sql.DB
}

func NewBreakingNewsRepository(db *sql.DB) BreakingNewsRepository {
	return &breakingNewsRepository{db: db}
}

func (r *breakingNewsRepository) Create(b *models.BreakingNews) (int64, error) {
	var id int64
	err := r.db.QueryRow(`
        INSERT INTO breaking_news (kind, product_id, title, is_active)
        VALUES ($1,$2,$3,$4)
        RETURNING id
    `, b.Kind, b.ProductID, b.Title, b.IsActive).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// ==== LIST ACTIVE UNTUK TICKER ====

func (r *breakingNewsRepository) ListActive() ([]*models.BreakingNews, error) {
	rows, err := r.db.Query(`
        SELECT 
            b.id,
            b.kind,
            b.product_id,
            b.title,
            b.is_active,
            b.created_at,
            b.updated_at,
            p.slug,
            p.title,
            p.kind
        FROM breaking_news b
        JOIN products p ON p.id = b.product_id
        WHERE b.is_active = TRUE
        ORDER BY b.created_at DESC
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*models.BreakingNews
	for rows.Next() {
		var (
			b models.BreakingNews
			p models.Product
		)
		if err := rows.Scan(
			&b.ID,
			&b.Kind,
			&b.ProductID,
			&b.Title,
			&b.IsActive,
			&b.CreatedAt,
			&b.UpdatedAt,
			&p.Slug,
			&p.Title,
			&p.Kind,
		); err != nil {
			return nil, err
		}

		b.ProductSlug = p.Slug
		b.Product = &p
		result = append(result, &b)
	}
	return result, nil
}

// ==== LIST ALL UNTUK ADMIN ====

func (r *breakingNewsRepository) ListAll() ([]*models.BreakingNews, error) {
	rows, err := r.db.Query(`
        SELECT 
            b.id,
            b.kind,
            b.product_id,
            b.title,
            b.is_active,
            b.created_at,
            b.updated_at,
            p.slug,
            p.title,
            p.kind
        FROM breaking_news b
        JOIN products p ON p.id = b.product_id
        ORDER BY b.created_at DESC
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*models.BreakingNews
	for rows.Next() {
		var (
			b models.BreakingNews
			p models.Product
		)
		if err := rows.Scan(
			&b.ID,
			&b.Kind,
			&b.ProductID,
			&b.Title,
			&b.IsActive,
			&b.CreatedAt,
			&b.UpdatedAt,
			&p.Slug,
			&p.Title,
			&p.Kind,
		); err != nil {
			return nil, err
		}
		b.ProductSlug = p.Slug
		b.Product = &p
		result = append(result, &b)
	}
	return result, nil
}

func (r *breakingNewsRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM breaking_news WHERE id = $1`, id)
	return err
}
