CREATE TABLE IF NOT EXISTS file_metadata (
    id                  TEXT PRIMARY KEY,      -- fileId (UUID)
    user_id             TEXT NOT NULL,
    original_file_name  TEXT NOT NULL,
    content_type        TEXT,
    storage_path        TEXT NOT NULL,         -- relative path under storage.root-dir
    size_bytes          INTEGER,
    status              TEXT NOT NULL,         -- PENDING | UPLOADED
    created_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id);
