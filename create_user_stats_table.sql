
-- Create user_stats table
-- Execute this SQL manually in your database

CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    messages_copied INTEGER DEFAULT 0,
    events_created INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Add foreign key constraint if users table exists
-- ALTER TABLE user_stats ADD CONSTRAINT fk_user_stats_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
