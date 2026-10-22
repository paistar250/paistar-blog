import { endSession } from '../../../server/auth';
import { csrf, endpoint, json } from '../../../server/http';
export const POST = endpoint(async context => { csrf(context); await endSession(context); return json({ ok: true }); });
