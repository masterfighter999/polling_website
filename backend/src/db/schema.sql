-- Polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY,
    question TEXT NOT NULL,
    creator_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Safe migration: Ensure creator_email exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'polls' AND column_name = 'creator_email') THEN
        ALTER TABLE polls ADD COLUMN creator_email TEXT;
    END IF;
END $$;

-- Options table
CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anti-abuse: one vote per fingerprint per poll
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_poll_voter
    ON votes (poll_id, voter_hash);

-- Anti-abuse: one vote per IP per poll
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_poll_ip
    ON votes (poll_id, ip_address);

-- Performance index for fetching options by poll
CREATE INDEX IF NOT EXISTS idx_options_poll_id
    ON options (poll_id);

-- Performance index for counting votes by option
CREATE INDEX IF NOT EXISTS idx_votes_option_id
    ON votes (option_id);
