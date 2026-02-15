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

-- Votes table (ip_hash stores HMAC-SHA256 of the IP, not raw IP)
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe migration: Rename ip_address → ip_hash if old column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'votes' AND column_name = 'ip_address') THEN
        ALTER TABLE votes RENAME COLUMN ip_address TO ip_hash;
    END IF;
END $$;

-- Anti-abuse: one vote per fingerprint per poll (keep this)
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_poll_voter
    ON votes (poll_id, voter_hash);

-- Drop the old unique IP constraint if it exists
-- (unique IP per poll was too restrictive for shared networks)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_votes_poll_ip') THEN
        DROP INDEX idx_votes_poll_ip;
    END IF;
END $$;

-- Non-unique index on ip_hash for rate-limiting lookups (application-layer abuse control)
CREATE INDEX IF NOT EXISTS idx_votes_poll_ip_hash
    ON votes (poll_id, ip_hash);

-- Performance index for fetching options by poll
CREATE INDEX IF NOT EXISTS idx_options_poll_id
    ON options (poll_id);

-- Performance index for counting votes by option
CREATE INDEX IF NOT EXISTS idx_votes_option_id
    ON votes (option_id);
