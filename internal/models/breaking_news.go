package models

import "time"

type BreakingNews struct {
	ID        int64       `json:"id"`
	Kind      ContentKind `json:"kind"`
	ProductID int64       `json:"product_id"`
	Title     string      `json:"title"`
	IsActive  bool        `json:"is_active"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`

	// Optional join ke product untuk response
	Product *Product `json:"product,omitempty"`
}
