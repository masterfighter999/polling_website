import fs from 'fs';
import path from 'path';
import pool from './index';

export async function initializeDatabase(): Promise<void> {
    try {
        // Try __dirname first (works with ts-node), fallback to src/db/ (for compiled output)
        let schemaPath = path.join(__dirname, 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
        }
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        await pool.query(schema);
        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
}
