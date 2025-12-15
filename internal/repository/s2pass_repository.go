package repository

import (
	"cc-helper-backend/internal/models"
	"database/sql"
)

type S2NodeRepository interface {
	Create(n *models.S2Node) (int64, error)
	Update(n *models.S2Node) error
	Delete(id int64) error
	GetByID(id int64) (*models.S2Node, error)
	ListByParent(main models.S2MainType, parentID *int64) ([]*models.S2Node, error)
}

type s2NodeRepository struct {
	db *sql.DB
}

func NewS2NodeRepository(db *sql.DB) S2NodeRepository {
	return &s2NodeRepository{db: db}
}

func (r *s2NodeRepository) Create(n *models.S2Node) (int64, error) {
	var id int64
	err := r.db.QueryRow(`
		INSERT INTO s2_nodes (
			main_type, parent_id, node_type, label,
			step_kind, title, body,
			input_key, input_label, input_placeholder, input_required,
			ui_mode,
			link_kind, link_slug, sort_order
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		RETURNING id
	`,
		n.MainType,
		n.ParentID,
		n.NodeType,
		n.Label,
		n.StepKind,
		n.Title,
		n.Body,
		n.InputKey,
		n.InputLabel,
		n.InputPlaceholder,
		n.InputRequired,
		n.UIMode,
		n.LinkKind,
		n.LinkSlug,
		n.SortOrder,
	).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *s2NodeRepository) Update(n *models.S2Node) error {
	_, err := r.db.Exec(`
		UPDATE s2_nodes
		SET main_type = $1,
			parent_id = $2,
			node_type = $3,
			label = $4,
			step_kind = $5,
			title = $6,
			body = $7,
			input_key = $8,
			input_label = $9,
			input_placeholder = $10,
			input_required = $11,
			ui_mode = $12,
			link_kind = $13,
			link_slug = $14,
			sort_order = $15,
			updated_at = NOW()
		WHERE id = $16
	`,
		n.MainType,
		n.ParentID,
		n.NodeType,
		n.Label,
		n.StepKind,
		n.Title,
		n.Body,
		n.InputKey,
		n.InputLabel,
		n.InputPlaceholder,
		n.InputRequired,
		n.UIMode,
		n.LinkKind,
		n.LinkSlug,
		n.SortOrder,
		n.ID,
	)
	return err
}

func (r *s2NodeRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM s2_nodes WHERE id = $1`, id)
	return err
}

func (r *s2NodeRepository) GetByID(id int64) (*models.S2Node, error) {
	row := r.db.QueryRow(`
		SELECT id, main_type, parent_id, node_type, label,
		       step_kind, title, body,
		       input_key, input_label, input_placeholder, input_required,
		       ui_mode,
		       link_kind, link_slug, sort_order,
		       created_at, updated_at
		FROM s2_nodes
		WHERE id = $1
	`, id)

	return scanS2NodeRow(row)
}

func scanS2NodeRow(scanner interface {
	Scan(dest ...any) error
}) (*models.S2Node, error) {
	var n models.S2Node

	var parentID sql.NullInt64
	var stepKind, title, body sql.NullString

	var inputKey, inputLabel, inputPlaceholder sql.NullString
	var inputRequired sql.NullBool

	var uiMode sql.NullString

	var linkKind sql.NullString
	var linkSlug sql.NullString

	if err := scanner.Scan(
		&n.ID,
		&n.MainType,
		&parentID,
		&n.NodeType,
		&n.Label,

		&stepKind,
		&title,
		&body,

		&inputKey,
		&inputLabel,
		&inputPlaceholder,
		&inputRequired,

		&uiMode,

		&linkKind,
		&linkSlug,
		&n.SortOrder,

		&n.CreatedAt,
		&n.UpdatedAt,
	); err != nil {
		return nil, err
	}

	if parentID.Valid {
		id := parentID.Int64
		n.ParentID = &id
	}

	if stepKind.Valid {
		tmp := models.S2StepKind(stepKind.String)
		n.StepKind = &tmp
	}

	if title.Valid {
		s := title.String
		n.Title = &s
	}
	if body.Valid {
		s := body.String
		n.Body = &s
	}

	if inputKey.Valid {
		s := inputKey.String
		n.InputKey = &s
	}
	if inputLabel.Valid {
		s := inputLabel.String
		n.InputLabel = &s
	}
	if inputPlaceholder.Valid {
		s := inputPlaceholder.String
		n.InputPlaceholder = &s
	}
	if inputRequired.Valid {
		n.InputRequired = inputRequired.Bool
	} else {
		n.InputRequired = false
	}

	if uiMode.Valid {
		s := uiMode.String
		n.UIMode = &s
	}

	if linkSlug.Valid {
		s := linkSlug.String
		n.LinkSlug = &s
	}
	if linkKind.Valid {
		k := models.S2LinkKind(linkKind.String)
		n.LinkKind = &k
	}

	return &n, nil
}

func (r *s2NodeRepository) ListByParent(main models.S2MainType, parentID *int64) ([]*models.S2Node, error) {
	var (
		rows *sql.Rows
		err  error
	)

	if parentID == nil {
		rows, err = r.db.Query(`
			SELECT id, main_type, parent_id, node_type, label,
			       step_kind, title, body,
			       input_key, input_label, input_placeholder, input_required,
			       ui_mode,
			       link_kind, link_slug, sort_order,
			       created_at, updated_at
			FROM s2_nodes
			WHERE main_type = $1 AND parent_id IS NULL
			ORDER BY sort_order, label
		`, main)
	} else {
		rows, err = r.db.Query(`
			SELECT id, main_type, parent_id, node_type, label,
			       step_kind, title, body,
			       input_key, input_label, input_placeholder, input_required,
			       ui_mode,
			       link_kind, link_slug, sort_order,
			       created_at, updated_at
			FROM s2_nodes
			WHERE main_type = $1 AND parent_id = $2
			ORDER BY sort_order, label
		`, main, *parentID)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.S2Node
	for rows.Next() {
		n, err := scanS2NodeRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}
