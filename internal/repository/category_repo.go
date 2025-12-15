package repository

import (
	"cc-helper-backend/internal/models"
	"database/sql"
)

type CategoryRepository interface {
	Create(c *models.Category) (int64, error)
	Delete(id int64) error
	GetByID(id int64) (*models.Category, error)
	ListByParent(kind models.ContentKind, parentID *int64) ([]*models.Category, error)
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
		INSERT INTO categories (kind, name, parent_id)
		VALUES ($1,$2,$3)
		RETURNING id
	`, c.Kind, c.Name, c.ParentID).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *categoryRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM categories WHERE id = $1`, id)
	return err
}

func (r *categoryRepository) GetByID(id int64) (*models.Category, error) {
	row := r.db.QueryRow(`
		SELECT id, kind, name, parent_id, created_at, updated_at
		FROM categories
		WHERE id = $1
	`, id)

	var c models.Category
	var parent sql.NullInt64
	if err := row.Scan(&c.ID, &c.Kind, &c.Name, &parent, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	if parent.Valid {
		p := parent.Int64
		c.ParentID = &p
	}
	return &c, nil
}

func (r *categoryRepository) ListByParent(kind models.ContentKind, parentID *int64) ([]*models.Category, error) {
	var (
		rows *sql.Rows
		err  error
	)
	if parentID == nil {
		rows, err = r.db.Query(`
			SELECT id, kind, name, parent_id, created_at, updated_at
			FROM categories
			WHERE kind = $1 AND parent_id IS NULL
			ORDER BY lower(name)
		`, kind)
	} else {
		rows, err = r.db.Query(`
			SELECT id, kind, name, parent_id, created_at, updated_at
			FROM categories
			WHERE kind = $1 AND parent_id = $2
			ORDER BY lower(name)
		`, kind, *parentID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.Category
	for rows.Next() {
		var c models.Category
		var parent sql.NullInt64
		if err := rows.Scan(&c.ID, &c.Kind, &c.Name, &parent, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		if parent.Valid {
			p := parent.Int64
			c.ParentID = &p
		}
		list = append(list, &c)
	}
	return list, nil
}
