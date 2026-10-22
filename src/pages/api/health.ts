import { ensureDatabase, rows } from '../../server/database';
import { endpoint, json } from '../../server/http';
export const GET = endpoint(async () => { await ensureDatabase(); await rows('SELECT 1'); return json({ok:true}); });
