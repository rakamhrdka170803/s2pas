package models

import "time"

type Category struct {
	ID             int64       `json:"id"`
	Kind           ContentKind `json:"kind"`            // product / script
	Category       string      `json:"category"`        // level 1
	SubCategory    string      `json:"sub_category"`    // level 2
	DetailCategory *string     `json:"detail_category"` // level 3 (optional)
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`
}
