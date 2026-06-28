import { getAllStates } from '../src/services/study.service';
import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const states = await getAllStates();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(states));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
  }
}
