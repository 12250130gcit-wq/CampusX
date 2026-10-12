package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	db *pgxpool.Pool
}

type Leave struct {
	ID          string     `json:"id"`
	StudentID   string     `json:"studentId"`
	StudentName string     `json:"studentName"`
	Date        string     `json:"date"`
	DateLabel   string     `json:"dateLabel"`
	ExitTime    string     `json:"exitTime"`
	ReturnTime  string     `json:"returnTime"`
	Destination string     `json:"destination"`
	Reason      string     `json:"reason"`
	Purpose     string     `json:"purpose"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"createdAt"`
	DecidedAt   *time.Time `json:"decidedAt,omitempty"`
	DecidedBy   string     `json:"decidedBy,omitempty"`
}

type CreateLeave struct {
	StudentID   string `json:"studentId"`
	StudentName string `json:"studentName"`
	Date        string `json:"date"`
	DateLabel   string `json:"dateLabel"`
	ExitTime    string `json:"exitTime"`
	ReturnTime  string `json:"returnTime"`
	Destination string `json:"destination"`
	Reason      string `json:"reason"`
	Purpose     string `json:"purpose"`
}

type Decision struct {
	Status    string `json:"status"`
	DecidedBy string `json:"decidedBy"`
}

type Activity struct {
	ID     string    `json:"id"`
	Type   string    `json:"type"`
	Title  string    `json:"title"`
	Detail string    `json:"detail"`
	Actor  string    `json:"actor"`
	Time   time.Time `json:"time"`
}

type Student struct {
	ID             string     `json:"id"`
	Name           string     `json:"name"`
	Program        string     `json:"program"`
	Gender         string     `json:"gender"`
	CID            string     `json:"cid"`
	Contact        string     `json:"contact"`
	Status         string     `json:"status"`
	LastExitAt     *time.Time `json:"lastExitAt,omitempty"`
	ExpectedReturn string     `json:"expectedReturn,omitempty"`
	ReturnNote     string     `json:"returnNote,omitempty"`
}

type Movement struct {
	ID             string    `json:"id"`
	StudentID      string    `json:"studentId"`
	Action         string    `json:"action"`
	RecordedAt     time.Time `json:"recordedAt"`
	ExpectedReturn string    `json:"expectedReturn,omitempty"`
	Note           string    `json:"note"`
	RecordedBy     string    `json:"recordedBy"`
}

type RecordMovement struct {
	StudentID      string `json:"studentId"`
	Action         string `json:"action"`
	ExpectedReturn string `json:"expectedReturn"`
	Note           string `json:"note"`
	RecordedBy     string `json:"recordedBy"`
}

func main() {
	ctx := context.Background()
	databaseURL := env("DATABASE_URL", "postgres://campusx:campusx@localhost:5432/campusx?sslmode=disable")
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatal("database connection failed: ", err)
	}
	if err := migrate(ctx, pool); err != nil {
		log.Fatal("database migration failed: ", err)
	}
	if err := seedStudents(ctx, pool); err != nil {
		log.Fatal("student roster seed failed: ", err)
	}

	server := &Server{db: pool}
	mux := http.NewServeMux()
	mux.HandleFunc("/health", server.health)
	mux.HandleFunc("/api/leaves", server.leaves)
	mux.HandleFunc("/api/leaves/", server.leaveByID)
	mux.HandleFunc("/api/activity", server.activity)
	mux.HandleFunc("/api/students", server.students)
	mux.HandleFunc("/api/students/", server.studentByID)
	mux.HandleFunc("/api/movements", server.movements)

	port := env("PORT", "8080")
	log.Printf("CampusX API listening on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, withCORS(mux)))
}

func migrate(ctx context.Context, db *pgxpool.Pool) error {
	path := filepath.Join("schema.sql")
	schema, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	_, err = db.Exec(ctx, string(schema))
	return err
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) leaves(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		studentID := strings.TrimSpace(r.URL.Query().Get("student_id"))
		query := `SELECT id, student_id, student_name, date, date_label, exit_time, return_time, destination, reason, purpose, status, created_at, decided_at, COALESCE(decided_by, '') FROM leaves`
		args := []any{}
		if studentID != "" {
			query += " WHERE student_id = $1"
			args = append(args, studentID)
		}
		query += " ORDER BY created_at DESC"
		rows, err := s.db.Query(r.Context(), query, args...)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer rows.Close()
		result := []Leave{}
		for rows.Next() {
			var leave Leave
			if err := rows.Scan(&leave.ID, &leave.StudentID, &leave.StudentName, &leave.Date, &leave.DateLabel, &leave.ExitTime, &leave.ReturnTime, &leave.Destination, &leave.Reason, &leave.Purpose, &leave.Status, &leave.CreatedAt, &leave.DecidedAt, &leave.DecidedBy); err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
			result = append(result, leave)
		}
		writeJSON(w, http.StatusOK, result)
	case http.MethodPost:
		var input CreateLeave
		if err := decodeJSON(r, &input); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		if err := validateLeave(input); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		id := newID("LV")
		dateLabel := input.DateLabel
		if dateLabel == "" {
			dateLabel = input.Date
		}
		_, err := s.db.Exec(r.Context(), `INSERT INTO leaves (id, student_id, student_name, date, date_label, exit_time, return_time, destination, reason, purpose) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, id, input.StudentID, input.StudentName, input.Date, dateLabel, input.ExitTime, input.ReturnTime, input.Destination, input.Reason, input.Purpose)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		leave, err := s.findLeave(r.Context(), id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		s.addActivity(r.Context(), "leave", "New leave request", input.StudentName+" requested leave to "+input.Destination+".", input.StudentName)
		writeJSON(w, http.StatusCreated, leave)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) leaveByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/leaves/")
	if id == "" || strings.Contains(id, "/") {
		writeError(w, http.StatusBadRequest, "invalid leave id")
		return
	}
	if r.Method != http.MethodPatch {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var input Decision
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	input.Status = strings.ToLower(strings.TrimSpace(input.Status))
	if input.Status != "approved" && input.Status != "rejected" {
		writeError(w, http.StatusBadRequest, "status must be approved or rejected")
		return
	}
	decidedBy := strings.TrimSpace(input.DecidedBy)
	if decidedBy == "" {
		decidedBy = "SSO Admin"
	}
	result, err := s.db.Exec(r.Context(), `UPDATE leaves SET status=$1, decided_at=NOW(), decided_by=$2 WHERE id=$3`, input.Status, decidedBy, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if result.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "leave not found")
		return
	}
	leave, err := s.findLeave(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	s.addActivity(r.Context(), "leave-decision", "Leave "+input.Status, leave.StudentName+"'s request to "+leave.Destination+" was "+input.Status+" by "+decidedBy+".", decidedBy)
	writeJSON(w, http.StatusOK, leave)
}

func (s *Server) activity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	rows, err := s.db.Query(r.Context(), `SELECT id, type, title, detail, actor, time FROM activity ORDER BY time DESC LIMIT 250`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	result := []Activity{}
	for rows.Next() {
		var item Activity
		if err := rows.Scan(&item.ID, &item.Type, &item.Title, &item.Detail, &item.Actor, &item.Time); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		result = append(result, item)
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) students(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	pattern := "%" + strings.ToLower(query) + "%"
	rows, err := s.db.Query(r.Context(), `SELECT id, name, program, gender, cid, contact, status, last_exit_at, COALESCE(expected_return, ''), COALESCE(return_note, '') FROM students WHERE $1 = '%%' OR LOWER(id) LIKE $1 OR LOWER(name) LIKE $1 ORDER BY id`, pattern)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	result := []Student{}
	for rows.Next() {
		var student Student
		if err := rows.Scan(&student.ID, &student.Name, &student.Program, &student.Gender, &student.CID, &student.Contact, &student.Status, &student.LastExitAt, &student.ExpectedReturn, &student.ReturnNote); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		result = append(result, student)
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) studentByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/students/")
	if id == "" || strings.Contains(id, "/") {
		writeError(w, http.StatusBadRequest, "invalid student id")
		return
	}
	student, err := s.findStudent(r.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "student not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, student)
}

func (s *Server) movements(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		studentID := strings.TrimSpace(r.URL.Query().Get("student_id"))
		rows, err := s.db.Query(r.Context(), `SELECT id, student_id, action, recorded_at, COALESCE(expected_return, ''), note, recorded_by FROM movements WHERE student_id = $1 ORDER BY recorded_at DESC`, studentID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer rows.Close()
		result := []Movement{}
		for rows.Next() {
			var movement Movement
			if err := rows.Scan(&movement.ID, &movement.StudentID, &movement.Action, &movement.RecordedAt, &movement.ExpectedReturn, &movement.Note, &movement.RecordedBy); err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
			result = append(result, movement)
		}
		writeJSON(w, http.StatusOK, result)
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var input RecordMovement
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	input.Action = strings.ToLower(strings.TrimSpace(input.Action))
	if input.Action != "exit" && input.Action != "return" || strings.TrimSpace(input.StudentID) == "" {
		writeError(w, http.StatusBadRequest, "studentId and action are required")
		return
	}
	if input.RecordedBy == "" {
		input.RecordedBy = "Gatekeeper"
	}
	student, err := s.findStudent(r.Context(), input.StudentID)
	if err != nil {
		writeError(w, http.StatusNotFound, "student not found")
		return
	}
	status := "outside"
	if input.Action == "return" {
		status = "inside"
	}
	_, err = s.db.Exec(r.Context(), `UPDATE students SET status=$1, last_exit_at=CASE WHEN $2='exit' THEN NOW() ELSE last_exit_at END, expected_return=$3, return_note=$4 WHERE id=$5`, status, input.Action, input.ExpectedReturn, input.Note, input.StudentID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	id := newID("MV")
	_, err = s.db.Exec(r.Context(), `INSERT INTO movements (id, student_id, action, expected_return, note, recorded_by) VALUES ($1,$2,$3,$4,$5,$6)`, id, input.StudentID, input.Action, input.ExpectedReturn, input.Note, input.RecordedBy)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	s.addActivity(r.Context(), "gate", "Student "+input.Action, student.Name+" was recorded at the gate.", input.RecordedBy)
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "student": student, "action": input.Action})
}

func (s *Server) findStudent(ctx context.Context, id string) (Student, error) {
	var student Student
	err := s.db.QueryRow(ctx, `SELECT id, name, program, gender, cid, contact, status, last_exit_at, COALESCE(expected_return, ''), COALESCE(return_note, '') FROM students WHERE id=$1`, id).Scan(&student.ID, &student.Name, &student.Program, &student.Gender, &student.CID, &student.Contact, &student.Status, &student.LastExitAt, &student.ExpectedReturn, &student.ReturnNote)
	return student, err
}

func seedStudents(ctx context.Context, db *pgxpool.Pool) error {
	students := []Student{
		{"12250052", "NIMA SEDON", "BSc in IDD", "Female", "10308002756", "17336337", "inside", nil, "", ""},
		{"12250119", "YANGCHEN GHALLEY", "BSc in IDD", "Female", "11202005630", "17342763", "inside", nil, "", ""},
		{"12250122", "JAMYANG SELDON", "BSc in IDD", "Female", "11208003160", "17413010", "inside", nil, "", ""},
		{"12250123", "JIGME NAMDREL", "BSc in IDD", "Male", "10607002371", "17433422", "inside", nil, "", ""},
		{"12250124", "KINGA ZAM", "BSc in IDD", "Female", "11410009297", "17539334", "inside", nil, "", ""},
		{"12250125", "KINLEY GYELTSHEN", "BSc in IDD", "Male", "11509005416", "17548360", "inside", nil, "", ""},
		{"12250126", "NORBU GYELTSHEN", "BSc in IDD", "Male", "11503006082", "17667815", "inside", nil, "", ""},
		{"12250127", "PEMA TENZIN", "BSc in IDD", "Male", "11105005013", "17785326", "inside", nil, "", ""},
		{"12250128", "PEMA YESHI WANGCHUK", "BSc in IDD", "Male", "11502003954", "17803646", "inside", nil, "", ""},
		{"12250129", "PURNA GURUNG", "BSc in IDD", "Male", "10307001144", "17809620", "inside", nil, "", ""},
		{"12250130", "RIGSEL WANGCHUK", "BSc in IDD", "Male", "10203005797", "17965422", "inside", nil, "", ""},
		{"12250131", "SONAM DORJI", "BSc in IDD", "Male", "11410009505", "77239508", "inside", nil, "", ""},
		{"12250132", "TASHI CHOZOM", "BSc in IDD", "Female", "12004004748", "77281580", "inside", nil, "", ""},
		{"12250133", "TASHI NORBU", "BSc in IDD", "Male", "11503005393", "77347539", "inside", nil, "", ""},
		{"12250134", "TENZIN YUDEN", "BSc in IDD", "Female", "11515005130", "77397825", "inside", nil, "", ""},
		{"12250135", "TSHERING TASHI", "BSc in IDD", "Male", "11511002490", "77441732", "inside", nil, "", ""},
		{"12250136", "TSHERING WANGCHUK", "BSc in IDD", "Male", "10202000727", "77742967", "inside", nil, "", ""},
		{"12250137", "TSHERING YESHI", "BSc in IDD", "Male", "11102007653", "77763898", "inside", nil, "", ""},
		{"12250138", "UYGEN ZANGPO", "BSc in IDD", "Male", "10604002295", "77792494", "inside", nil, "", ""},
		{"12250139", "YESHEY NGEDUP DORJI", "BSc in IDD", "Male", "10703003336", "77820271", "inside", nil, "", ""},
	}
	for _, student := range students {
		_, err := db.Exec(ctx, `INSERT INTO students (id, name, program, gender, cid, contact) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, program=EXCLUDED.program, gender=EXCLUDED.gender, cid=EXCLUDED.cid, contact=EXCLUDED.contact`, student.ID, student.Name, student.Program, student.Gender, student.CID, student.Contact)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Server) findLeave(ctx context.Context, id string) (Leave, error) {
	var leave Leave
	err := s.db.QueryRow(ctx, `SELECT id, student_id, student_name, date, date_label, exit_time, return_time, destination, reason, purpose, status, created_at, decided_at, COALESCE(decided_by, '') FROM leaves WHERE id=$1`, id).Scan(&leave.ID, &leave.StudentID, &leave.StudentName, &leave.Date, &leave.DateLabel, &leave.ExitTime, &leave.ReturnTime, &leave.Destination, &leave.Reason, &leave.Purpose, &leave.Status, &leave.CreatedAt, &leave.DecidedAt, &leave.DecidedBy)
	return leave, err
}

func (s *Server) addActivity(ctx context.Context, activityType, title, detail, actor string) {
	_, _ = s.db.Exec(ctx, `INSERT INTO activity (id, type, title, detail, actor) VALUES ($1,$2,$3,$4,$5)`, newID("ACT"), activityType, title, detail, actor)
}

func validateLeave(input CreateLeave) error {
	fields := map[string]string{"studentId": input.StudentID, "studentName": input.StudentName, "date": input.Date, "exitTime": input.ExitTime, "returnTime": input.ReturnTime, "destination": input.Destination, "reason": input.Reason}
	for name, value := range fields {
		if strings.TrimSpace(value) == "" {
			return errors.New(name + " is required")
		}
	}
	if input.ReturnTime <= input.ExitTime {
		return errors.New("returnTime must be later than exitTime")
	}
	return nil
}

func newID(prefix string) string {
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		return prefix + "-" + time.Now().Format("20060102150405")
	}
	return prefix + "-" + strings.ToUpper(hex.EncodeToString(buf))
}

func decodeJSON(r *http.Request, target any) error {
	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", env("FRONTEND_ORIGIN", "http://localhost:8000"))
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
