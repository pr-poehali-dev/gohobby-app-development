CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    yandex_id VARCHAR(64) UNIQUE,
    email VARCHAR(255),
    name VARCHAR(120) NOT NULL,
    birth_date DATE,
    avatar_url TEXT,
    hobbies TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    rating NUMERIC(2,1) DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
