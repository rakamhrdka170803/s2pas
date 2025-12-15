package models

import "time"

type S2MainType string

const (
	S2MainCall      S2MainType = "call" // ✅ baru
	S2MainInfo      S2MainType = "info"
	S2MainRequest   S2MainType = "request"
	S2MainComplaint S2MainType = "complaint"
)

type S2NodeType string

const (
	S2NodeMenu S2NodeType = "menu"
	S2NodeStep S2NodeType = "step"
)

type S2StepKind string

const (
	S2StepScript S2StepKind = "script" // body HTML/text
	S2StepInput  S2StepKind = "input"  // input field (nama nasabah, dll)
	S2StepLink   S2StepKind = "link"   // link ke product/script (pakai link_kind+link_slug)
)

type S2LinkKind string

const (
	S2LinkProduct S2LinkKind = "product"
	S2LinkScript  S2LinkKind = "script"
)

type S2Node struct {
	ID       int64      `json:"id"`
	MainType S2MainType `json:"main_type"`
	ParentID *int64     `json:"parent_id,omitempty"`

	NodeType S2NodeType `json:"node_type"`
	Label    string     `json:"label"`

	// ✅ step type
	StepKind *S2StepKind `json:"step_kind,omitempty"` // script/input/link

	Title *string `json:"title,omitempty"`
	Body  *string `json:"body,omitempty"`

	// ✅ input step fields
	InputKey         *string `json:"input_key,omitempty"`
	InputLabel       *string `json:"input_label,omitempty"`
	InputPlaceholder *string `json:"input_placeholder,omitempty"`
	InputRequired    bool    `json:"input_required"`

	// ✅ menu ui behavior
	UIMode *string `json:"ui_mode,omitempty"` // tree/accordion

	// optional: link ke product/script
	LinkKind *S2LinkKind `json:"link_kind,omitempty"`
	LinkSlug *string     `json:"link_slug,omitempty"`

	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
