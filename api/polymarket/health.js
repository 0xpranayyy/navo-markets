import { missingCreds, setCors } from '../_lib/sign-utils.js';

export default function handler(req, res) {
  setCors(res, req);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.status(200).json({
    configured: !missingCreds(),
    service: 'navo-sign',
    version: '1.1.0',
  });
}
