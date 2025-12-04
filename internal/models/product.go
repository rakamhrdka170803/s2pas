package models

import "time"

type ContentType string

const (
	ContentTypeText  ContentType = "text"
	ContentTypeImage ContentType = "image"
)

type ContentBlock struct {
	Type     ContentType `json:"type"`
	Text     *string     `json:"text,omitempty"`
	ImageURL *string     `json:"imageUrl,omitempty"`
	AltText  *string     `json:"altText,omitempty"`
}

type ContentKind string

const (
	ContentKindProduct ContentKind = "product"
	ContentKindScript  ContentKind = "script"
)

type Product struct {
	ID        int64          `json:"id"`
	Kind      ContentKind    `json:"kind"` // "product" atau "script"
	Slug      string         `json:"slug"` // bjb-t-samsat
	Title     string         `json:"title"`
	Category  string         `json:"category"`
	Blocks    []ContentBlock `json:"blocks"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}
