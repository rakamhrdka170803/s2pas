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
	List(kind models.ContentKind, q string, categoryID *int64, category, subCategory, detailCategory string, limit, offset int) ([]*models.Product, error)
	Create(p *models.Product) (int64, error)
	Update(p *models.Product) error
	Delete(id int64) error
	ListCategories(kind models.ContentKind) ([]*models.Category, error)
}

type productRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) scanProductRow(row *sql.Row) (*models.Product, error) {
	var (
		p              models.Product
		blocks         []byte
		detailCategory sql.NullString
	)
	err := row.Scan(
		&p.ID,
		&p.Kind,
		&p.Slug,
		&p.Title,
		&p.CategoryID,
		&p.Category,
		&p.SubCategory,
		&detailCategory,
		&blocks,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if detailCategory.Valid {
		p.DetailCategory = &detailCategory.String
	}
	_ = json.Unmarshal(blocks, &p.Blocks)
	return &p, nil
}

func (r *productRepository) GetByID(id int64) (*models.Product, error) {
	row := r.db.QueryRow(`
        SELECT 
            p.id, p.kind, p.slug, p.title,
            p.category_id,
            c.category, c.sub_category, c.detail_category,
            p.blocks, p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
    `, id)
	return r.scanProductRow(row)
}

func (r *productRepository) GetBySlug(kind models.ContentKind, slug string) (*models.Product, error) {
	row := r.db.QueryRow(`
        SELECT 
            p.id, p.kind, p.slug, p.title,
            p.category_id,
            c.category, c.sub_category, c.detail_category,
            p.blocks, p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.kind = $1 AND p.slug = $2
    `, kind, slug)
	return r.scanProductRow(row)
}

func (r *productRepository) List(
	kind models.ContentKind,
	q string,
	categoryID *int64,
	category, subCategory, detailCategory string,
	limit, offset int,
) ([]*models.Product, error) {
	base := `
        SELECT 
            p.id, p.kind, p.slug, p.title,
            p.category_id,
            c.category, c.sub_category, c.detail_category,
            p.blocks, p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.kind = $1
    `
	args := []interface{}{kind}
	argIdx := 2

	if q != "" {
		base += " AND (p.title ILIKE $" + strconv.Itoa(argIdx) +
			" OR c.category ILIKE $" + strconv.Itoa(argIdx) +
			" OR c.sub_category ILIKE $" + strconv.Itoa(argIdx) +
			" OR COALESCE(c.detail_category,'') ILIKE $" + strconv.Itoa(argIdx) +
			" OR p.blocks::text ILIKE $" + strconv.Itoa(argIdx) + ")"
		args = append(args, "%"+q+"%")
		argIdx++
	}

	if categoryID != nil {
		base += " AND p.category_id = $" + strconv.Itoa(argIdx)
		args = append(args, *categoryID)
		argIdx++
	}

	if category != "" {
		base += " AND c.category = $" + strconv.Itoa(argIdx)
		args = append(args, category)
		argIdx++
	}
	if subCategory != "" {
		base += " AND c.sub_category = $" + strconv.Itoa(argIdx)
		args = append(args, subCategory)
		argIdx++
	}
	if detailCategory != "" {
		base += " AND c.detail_category = $" + strconv.Itoa(argIdx)
		args = append(args, detailCategory)
		argIdx++
	}

	base += " ORDER BY p.title"

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

	var result []*models.Product
	for rows.Next() {
		var (
			p              models.Product
			blocks         []byte
			detailCategory sql.NullString
		)
		if err := rows.Scan(
			&p.ID,
			&p.Kind,
			&p.Slug,
			&p.Title,
			&p.CategoryID,
			&p.Category,
			&p.SubCategory,
			&detailCategory,
			&blocks,
			&p.CreatedAt,
			&p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if detailCategory.Valid {
			p.DetailCategory = &detailCategory.String
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
        INSERT INTO products (kind, slug, title, category, category_id, blocks)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING id
    `,
		p.Kind,
		p.Slug,
		p.Title,
		p.Category,   // <-- string gabungan "Kredit / KGB / KGB PISAN"
		p.CategoryID, // <-- FK ke categories.id
		blocks,
	).Scan(&id)
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
            category_id = $5,
            blocks = $6,
            updated_at = NOW()
        WHERE id = $7
    `,
		p.Kind,
		p.Slug,
		p.Title,
		p.Category, // <-- isi juga
		p.CategoryID,
		blocks,
		p.ID,
	)
	return err
}

func (r *productRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM products WHERE id = $1`, id)
	return err
}

func (r *productRepository) ListCategories(kind models.ContentKind) ([]*models.Category, error) {
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

	var list []*models.Category
	for rows.Next() {
		var (
			c            models.Category
			detailCatSQL sql.NullString
		)
		if err := rows.Scan(
			&c.ID,
			&c.Kind,
			&c.Category,
			&c.SubCategory,
			&detailCatSQL,
			&c.CreatedAt,
			&c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if detailCatSQL.Valid {
			c.DetailCategory = &detailCatSQL.String
		}
		list = append(list, &c)
	}
	return list, nil
}
