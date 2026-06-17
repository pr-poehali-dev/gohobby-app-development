CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    hobby VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    activity_date DATE NOT NULL,
    activity_time VARCHAR(10) NOT NULL,
    place TEXT NOT NULL,
    spots_total INTEGER NOT NULL DEFAULT 2,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_participants (
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE IF NOT EXISTS activity_skips (
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    PRIMARY KEY (activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_activities_creator ON activities(creator_id);
CREATE INDEX IF NOT EXISTS idx_activities_active ON activities(is_active);
CREATE INDEX IF NOT EXISTS idx_participants_activity ON activity_participants(activity_id);
