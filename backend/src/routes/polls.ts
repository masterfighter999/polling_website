import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import pool from '../db/index';
import { broadcastPollUpdate } from '../socket';

const router = Router();

// HMAC secret for IP hashing — set IP_HASH_SECRET in .env for persistence across restarts
const IP_HASH_SECRET = process.env.IP_HASH_SECRET || (() => {
    const fallback = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  IP_HASH_SECRET not set — using random secret (hashes won\'t persist across restarts)');
    return fallback;
})();

/**
 * Compute a deterministic, keyed HMAC-SHA256 hash of an IP address.
 * This prevents storing raw IP (PII) while allowing duplicate detection.
 */
function hashIp(ip: string): string {
    return crypto.createHmac('sha256', IP_HASH_SECRET).update(ip).digest('hex');
}

// ─── CREATE POLL ──────────────────────────────────────────────
// POST /api/polls
// Body: { question: string, options: string[] }
// Returns: { id: string }
router.post('/', async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();
    try {
        const { question, options, creatorEmail } = req.body;

        // Validation
        if (!question || typeof question !== 'string' || !question.trim()) {
            res.status(400).json({ error: 'Question is required' });
            return;
        }

        if (!Array.isArray(options) || options.length < 2) {
            res.status(400).json({ error: 'At least 2 options are required' });
            return;
        }

        if (options.length > 10) {
            res.status(400).json({ error: 'Maximum 10 options allowed' });
            return;
        }

        const filteredOptions = options.filter(
            (opt: any) => typeof opt === 'string' && opt.trim()
        );

        if (filteredOptions.length < 2) {
            res.status(400).json({ error: 'At least 2 non-empty options are required' });
            return;
        }

        const pollId = uuidv4();

        // Use a transaction to ensure atomicity
        await client.query('BEGIN');

        // Insert poll
        await client.query(
            'INSERT INTO polls (id, question, creator_email) VALUES ($1, $2, $3)',
            [pollId, question.trim(), creatorEmail || null]
        );

        // Insert options
        for (let i = 0; i < filteredOptions.length; i++) {
            await client.query(
                'INSERT INTO options (poll_id, text, position) VALUES ($1, $2, $3)',
                [pollId, filteredOptions[i].trim(), i]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({ id: pollId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
    } finally {
        client.release();
    }
});

// ─── GET USER POLLS (DASHBOARD) ───────────────────────────────
// GET /api/polls/user?email=...
// Returns: [{ id, question, votes, status, created_at }]
router.get('/user', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== 'string') {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const result = await pool.query(
            `SELECT p.id, p.question, p.created_at,
                    COUNT(v.id)::int AS votes,
                    CASE WHEN p.expires_at IS NOT NULL AND p.expires_at < NOW() THEN 'Ended' ELSE 'Active' END AS status
             FROM polls p
             LEFT JOIN options o ON o.poll_id = p.id
             LEFT JOIN votes v ON v.option_id = o.id
             WHERE p.creator_email = $1
             GROUP BY p.id
             ORDER BY p.created_at DESC`,
            [email]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching dashboard polls:', error);
        res.status(500).json({ error: 'Failed to fetch polls' });
    }
});

// ─── GET POLL ─────────────────────────────────────────────────
// GET /api/polls/:id
// Returns: { id, question, expiresAt, options: [{ id, text, votes }] }
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Fetch poll
        const pollResult = await pool.query(
            'SELECT id, question, expires_at FROM polls WHERE id = $1',
            [id]
        );

        if (pollResult.rows.length === 0) {
            res.status(404).json({ error: 'Poll not found' });
            return;
        }

        const poll = pollResult.rows[0];

        // Fetch options with vote counts
        const optionsResult = await pool.query(
            `SELECT o.id, o.text, COUNT(v.id)::int AS votes
             FROM options o
             LEFT JOIN votes v ON v.option_id = o.id
             WHERE o.poll_id = $1
             GROUP BY o.id, o.text, o.position
             ORDER BY o.position ASC`,
            [id]
        );

        res.json({
            id: poll.id,
            question: poll.question,
            expiresAt: poll.expires_at,
            options: optionsResult.rows,
        });
    } catch (error) {
        console.error('Error fetching poll:', error);
        res.status(500).json({ error: 'Failed to fetch poll' });
    }
});

// ─── VOTE ON POLL ─────────────────────────────────────────────
// POST /api/polls/:id/vote
// Body: { optionId: number, voterHash: string }
router.post('/:id/vote', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { optionId, voterHash } = req.body;

        // Validate optionId is a valid positive integer
        const parsedOptionId = Number(optionId);
        if (!Number.isInteger(parsedOptionId) || parsedOptionId <= 0) {
            res.status(400).json({ error: 'optionId must be a valid number' });
            return;
        }

        // Validate voterHash presence
        if (!voterHash) {
            res.status(400).json({ error: 'voterHash is required' });
            return;
        }

        // Derive IP strictly from server-side sources (never trust client body)
        const voterIp = req.ip || req.socket.remoteAddress;
        if (!voterIp) {
            console.warn(`⚠️  Could not determine IP for vote on poll ${id} (User-Agent: ${req.headers['user-agent'] || 'unknown'})`);
            res.status(400).json({ error: 'Unable to determine client IP address' });
            return;
        }
        const ipHash = hashIp(voterIp);

        // Check poll exists
        const pollResult = await pool.query(
            'SELECT id, expires_at FROM polls WHERE id = $1',
            [id]
        );

        if (pollResult.rows.length === 0) {
            res.status(404).json({ error: 'Poll not found' });
            return;
        }

        // Check if poll has expired
        const poll = pollResult.rows[0];
        if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
            res.status(403).json({ error: 'This poll has expired' });
            return;
        }

        // Check option belongs to this poll
        const optionResult = await pool.query(
            'SELECT id FROM options WHERE id = $1 AND poll_id = $2',
            [parsedOptionId, id]
        );

        if (optionResult.rows.length === 0) {
            res.status(400).json({ error: 'Invalid option for this poll' });
            return;
        }

        // Try to insert vote — unique constraint on voter_hash handles anti-abuse
        try {
            await pool.query(
                `INSERT INTO votes (option_id, poll_id, voter_hash, ip_hash)
                 VALUES ($1, $2, $3, $4)`,
                [parsedOptionId, id, voterHash, ipHash]
            );
        } catch (dbError: any) {
            // Unique constraint violation = duplicate vote
            if (dbError.code === '23505') {
                res.status(403).json({ error: 'You have already voted on this poll' });
                return;
            }
            throw dbError;
        }

        // Fetch updated options to broadcast
        const updatedOptions = await pool.query(
            `SELECT o.id, o.text, COUNT(v.id)::int AS votes
             FROM options o
             LEFT JOIN votes v ON v.option_id = o.id
             WHERE o.poll_id = $1
             GROUP BY o.id, o.text, o.position
             ORDER BY o.position ASC`,
            [id]
        );

        const broadcastData = {
            id,
            options: updatedOptions.rows,
        };

        // Broadcast real-time update via Socket.IO
        broadcastPollUpdate(id, broadcastData);

        res.json({ success: true, options: updatedOptions.rows });
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: 'Failed to submit vote' });
    }
});

// ─── DELETE POLL ───────────────────────────────────────────────
// DELETE /api/polls/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const result = await pool.query(
            'DELETE FROM polls WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Poll not found' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting poll:', error);
        res.status(500).json({ error: 'Failed to delete poll' });
    }
});

export default router;
