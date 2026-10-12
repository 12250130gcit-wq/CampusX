CREATE TABLE IF NOT EXISTS leaves (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    date TEXT NOT NULL,
    date_label TEXT NOT NULL,
    exit_time TEXT NOT NULL,
    return_time TEXT NOT NULL,
    destination TEXT NOT NULL,
    reason TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    decided_by TEXT
);

CREATE INDEX IF NOT EXISTS leaves_student_id_idx ON leaves (student_id);
CREATE INDEX IF NOT EXISTS leaves_created_at_idx ON leaves (created_at DESC);

CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    actor TEXT NOT NULL,
    time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_time_idx ON activity (time DESC);

CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    program TEXT NOT NULL,
    gender TEXT NOT NULL,
    cid TEXT NOT NULL,
    contact TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inside' CHECK (status IN ('inside', 'outside', 'overdue')),
    last_exit_at TIMESTAMPTZ,
    expected_return TEXT,
    return_note TEXT
);

CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id),
    action TEXT NOT NULL CHECK (action IN ('exit', 'return')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_return TEXT,
    note TEXT NOT NULL DEFAULT '',
    recorded_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS movements_student_id_idx ON movements (student_id, recorded_at DESC);
