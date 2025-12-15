package models

import "time"

type Category struct {
	ID        int64       `json:"id"`
	Kind      ContentKind `json:"kind"` // product / script
	Name      string      `json:"name"`
	ParentID  *int64      `json:"parent_id,omitempty"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}
