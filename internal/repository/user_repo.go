package repository

import (
	"database/sql"

	"cc-helper-backend/internal/models"
)

type UserRepository interface {
	GetByUsername(username string) (*models.User, error)
	GetByID(id int64) (*models.User, error)
	List() ([]*models.User, error)
	Create(u *models.User) (int64, error)
	Update(u *models.User) error
	Delete(id int64) error
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetByUsername(username string) (*models.User, error) {
	u := &models.User{}
	err := r.db.QueryRow(`
        SELECT id, username, name, password_hash, role, created_at
        FROM users
        WHERE username = $1
    `, username).Scan(&u.ID, &u.Username, &u.Name, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *userRepository) GetByID(id int64) (*models.User, error) {
	u := &models.User{}
	err := r.db.QueryRow(`
        SELECT id, username, name, password_hash, role, created_at
        FROM users WHERE id = $1
    `, id).Scan(&u.ID, &u.Username, &u.Name, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *userRepository) List() ([]*models.User, error) {
	rows, err := r.db.Query(`
        SELECT id, username, name, role, created_at
        FROM users ORDER BY id
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*models.User
	for rows.Next() {
		u := &models.User{}
		if err := rows.Scan(&u.ID, &u.Username, &u.Name, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, u)
	}
	return result, nil
}

func (r *userRepository) Create(u *models.User) (int64, error) {
	var id int64
	err := r.db.QueryRow(`
        INSERT INTO users (username, name, password_hash, role)
        VALUES ($1,$2,$3,$4)
        RETURNING id
    `, u.Username, u.Name, u.PasswordHash, u.Role).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *userRepository) Update(u *models.User) error {
	_, err := r.db.Exec(`
        UPDATE users
        SET name = $1, password_hash = $2, role = $3
        WHERE id = $4
    `, u.Name, u.PasswordHash, u.Role, u.ID)
	return err
}

func (r *userRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM users WHERE id = $1`, id)
	return err
}
