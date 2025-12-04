package repository

import (
	"cc-helper-backend/internal/models"
	"database/sql"
)

type CategoryRepository interface {
	Create(c *models.Category) (int64, error)
	Update(c *models.Category) error
	Delete(id int64) error
	ListByKind(kind models.ContentKind) ([]*models.Category, error)
	GetByID(id int64) (*models.Category, error)
}

type categoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(c *models.Category) (int64, error) {
	var id int64
	err := r.db.QueryRow(`
        INSERT INTO categories (kind, category, sub_category, detail_category)
        VALUES ($1,$2,$3,$4)
        RETURNING id
    `, c.Kind, c.Category, c.SubCategory, c.DetailCategory).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *categoryRepository) Update(c *models.Category) error {
	_, err := r.db.Exec(`
        UPDATE categories
        SET category = $1,
            sub_category = $2,
            detail_category = $3,
            updated_at = NOW()
        WHERE id = $4
    `, c.Category, c.SubCategory, c.DetailCategory, c.ID)
	return err
}

func (r *categoryRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM categories WHERE id = $1`, id)
	return err
}

func (r *categoryRepository) ListByKind(kind models.ContentKind) ([]*models.Category, error) {
	rows, err := r.db.Query(`
        SELECT id, kind, category, sub_category, detail_category, created_at, updated_at
        FROM categories
        WHERE kind = $1
        ORDER BY category, sub_category, COALESCE(detail_category,'')
    `, kind)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(
			&c.ID,
			&c.Kind,
			&c.Category,
			&c.SubCategory,
			&c.DetailCategory,
			&c.CreatedAt,
			&c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		result = append(result, &c)
	}
	return result, nil
}

func (r *categoryRepository) GetByID(id int64) (*models.Category, error) {
	row := r.db.QueryRow(`
        SELECT id, kind, category, sub_category, detail_category, created_at, updated_at
        FROM categories
        WHERE id = $1
    `, id)

	var c models.Category
	if err := row.Scan(
		&c.ID,
		&c.Kind,
		&c.Category,
		&c.SubCategory,
		&c.DetailCategory,
		&c.CreatedAt,
		&c.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &c, nil
}
