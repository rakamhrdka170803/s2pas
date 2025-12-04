package models

import "time"

type Role string

const (
	RoleAdmin Role = "admin"
	RoleAgent Role = "agent"
)

type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}
