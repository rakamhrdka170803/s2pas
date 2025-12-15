package handler

import (
	"cc-helper-backend/internal/models"
	"cc-helper-backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type S2Handler struct {
	svc *service.S2Service
}

func NewS2Handler(s *service.S2Service) *S2Handler {
	return &S2Handler{svc: s}
}

// === Agent: GET /s2pass/nodes?main=call|info|request|complaint&parentId=123 ===
func (h *S2Handler) ListNodes(c *gin.Context) {
	main := c.Query("main")
	if main == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "main is required"})
		return
	}
	var parentID *int64
	if p := c.Query("parentId"); p != "" {
		id, err := strconv.ParseInt(p, 10, 64)
		if err == nil {
			parentID = &id
		}
	}

	list, err := h.svc.ListByParent(main, parentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

// === Admin DTO ===
type s2NodeRequest struct {
	MainType string `json:"main_type" binding:"required"` // call/info/request/complaint
	ParentID *int64 `json:"parent_id"`

	NodeType string `json:"node_type" binding:"required"` // menu/step
	Label    string `json:"label" binding:"required"`

	StepKind *string `json:"step_kind"` // script/input/link

	Title *string `json:"title"`
	Body  *string `json:"body"`

	InputKey         *string `json:"input_key"`
	InputLabel       *string `json:"input_label"`
	InputPlaceholder *string `json:"input_placeholder"`
	InputRequired    *bool   `json:"input_required"`

	UIMode *string `json:"ui_mode"` // tree/accordion

	LinkKind *string `json:"link_kind"` // product/script/null
	LinkSlug *string `json:"link_slug"`

	SortOrder *int `json:"sort_order"`
}

func (r *s2NodeRequest) toModel(idOptional ...int64) *models.S2Node {
	var main models.S2MainType
	switch r.MainType {
	case "call":
		main = models.S2MainCall
	case "info":
		main = models.S2MainInfo
	case "request":
		main = models.S2MainRequest
	default:
		main = models.S2MainComplaint
	}

	nt := models.S2NodeMenu
	if r.NodeType == "step" {
		nt = models.S2NodeStep
	}

	var sk *models.S2StepKind
	if r.StepKind != nil && *r.StepKind != "" {
		tmp := models.S2StepKind(*r.StepKind)
		sk = &tmp
	}

	var lk *models.S2LinkKind
	if r.LinkKind != nil && *r.LinkKind != "" {
		tmp := models.S2LinkKind(*r.LinkKind)
		lk = &tmp
	}

	sort := 0
	if r.SortOrder != nil {
		sort = *r.SortOrder
	}

	inputRequired := false
	if r.InputRequired != nil {
		inputRequired = *r.InputRequired
	}

	n := &models.S2Node{
		MainType:         main,
		ParentID:         r.ParentID,
		NodeType:         nt,
		Label:            r.Label,
		StepKind:         sk,
		Title:            r.Title,
		Body:             r.Body,
		InputKey:         r.InputKey,
		InputLabel:       r.InputLabel,
		InputPlaceholder: r.InputPlaceholder,
		InputRequired:    inputRequired,
		UIMode:           r.UIMode,
		LinkKind:         lk,
		LinkSlug:         r.LinkSlug,
		SortOrder:        sort,
	}

	if len(idOptional) > 0 {
		n.ID = idOptional[0]
	}
	return n
}

// === Admin: CREATE /admin/s2pass/nodes ===
func (h *S2Handler) CreateNode(c *gin.Context) {
	var body s2NodeRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	n := body.toModel()
	id, err := h.svc.CreateNode(n)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// === Admin: UPDATE /admin/s2pass/nodes/:id ===
func (h *S2Handler) UpdateNode(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var body s2NodeRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	n := body.toModel(id)
	if err := h.svc.UpdateNode(n); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// === Admin: DELETE /admin/s2pass/nodes/:id ===
func (h *S2Handler) DeleteNode(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.svc.DeleteNode(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
