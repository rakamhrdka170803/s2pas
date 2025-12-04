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
	ID         int64          `json:"id"`
	Kind       ContentKind    `json:"kind"`
	Slug       string         `json:"slug"`
	Title      string         `json:"title"`
	CategoryID int64          `json:"categoryId"` // ✅ WAJIB
	Blocks     []ContentBlock `json:"blocks"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`

	// hasil JOIN dari categories (read only)
	Category       string  `json:"category,omitempty"`
	SubCategory    string  `json:"subCategory,omitempty"`
	DetailCategory *string `json:"detailCategory,omitempty"`
}
