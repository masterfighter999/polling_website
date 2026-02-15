import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/index';
import { broadcastPollUpdate } from '../socket';

const router = Router();

// ─── CREATE POLL ──────────────────────────────────────────────
// POST /api/polls
// Body: { question: string, options: string[] }
// Returns: { id: string }
router.post('/', async (req: Request, res: Response): Promise<void> => {
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

        // Insert poll
        await pool.query(
            'INSERT INTO polls (id, question, creator_email) VALUES ($1, $2, $3)',
            [pollId, question.trim(), creatorEmail || null]
        );

        // Insert options
        for (let i = 0; i < filteredOptions.length; i++) {
            await pool.query(
                'INSERT INTO options (poll_id, text, position) VALUES ($1, $2, $3)',
                [pollId, filteredOptions[i].trim(), i]
            );
        }

        res.status(201).json({ id: pollId });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
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
// Body: { optionId: number, voterHash: string, ipAddress: string }
router.post('/:id/vote', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { optionId, voterHash, ipAddress } = req.body;

        // Validation
        if (!optionId || !voterHash) {
            res.status(400).json({ error: 'optionId and voterHash are required' });
            return;
        }

        // Use the client IP from the request if ipAddress is not provided
        const voterIp = ipAddress || req.ip || 'unknown';

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
            [optionId, id]
        );

        if (optionResult.rows.length === 0) {
            res.status(400).json({ error: 'Invalid option for this poll' });
            return;
        }

        // Try to insert vote — unique constraints handle anti-abuse
        try {
            await pool.query(
                `INSERT INTO votes (option_id, poll_id, voter_hash, ip_address)
                 VALUES ($1, $2, $3, $4)`,
                [optionId, id, voterHash, voterIp]
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
