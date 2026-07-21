import {
  buildHmacSignature,
  getBuilderCreds,
  missingCreds,
  safeErrorMessage,
  setCors,
  validateSignRequest,
} from '../_lib/sign-utils.js';

export default async function handler(req, res) {
  setCors(res, req);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (missingCreds()) {
    res.status(503).json({ error: 'Builder credentials not configured' });
    return;
  }

  try {
    const validation = await validateSignRequest(req, req.body ?? {});
    if (!validation.ok) {
      res.status(validation.status).json({ error: validation.error });
      return;
    }

    const creds = getBuilderCreds();
    const { method, path, body: payload } = validation;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = buildHmacSignature(creds.secret, timestamp, method, path, payload);

    res.status(200).json({
      POLY_BUILDER_SIGNATURE: signature,
      POLY_BUILDER_TIMESTAMP: String(timestamp),
      POLY_BUILDER_API_KEY: creds.key,
      POLY_BUILDER_PASSPHRASE: creds.passphrase,
    });
  } catch (err) {
    res.status(500).json({ error: safeErrorMessage(err, 'Sign failed') });
  }
}
