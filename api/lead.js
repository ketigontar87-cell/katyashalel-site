// Shared intake for the audit, company, ongoing-work and Sprint forms.
// Credentials live in Vercel. The recipient is fixed, never supplied by a visitor.
// RESEND_API_KEY must have sending_access for the verified legibi.ai domain.
import { createHash } from 'node:crypto';

const RECIPIENT = 'shalelekaterina@gmail.com';
const FIELDS = [
  ['name', 'Name', 120], ['email', 'Reply email', 160],
  ['company', 'Company or professional title', 160], ['site', 'Website', 300],
  ['entities', 'Scope', 80], ['markets', 'Markets and languages', 200],
  ['source', 'How they found this', 200], ['message', 'Message', 12000],
];
const RATE = new Map();
const WINDOW_MS = 60000;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', 'https://katyashalel.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const origin = req.headers?.origin;
  const allowed = new Set(['https://katyashalel.com', 'https://www.katyashalel.com']);
  if (process.env.VERCEL_URL) allowed.add('https://' + process.env.VERCEL_URL);
  if (origin && !allowed.has(origin)) return res.status(403).json({ ok: false, error: 'invalid_origin' });
  const ip = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isThrottled(ip)) return res.status(429).json({ ok: false, error: 'too_many_requests' });

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > 20000) return res.status(413).json({ ok: false, error: 'body_too_large' });
    try { body = JSON.parse(body); } catch { return res.status(400).json({ ok: false, error: 'bad_json' }); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ ok: false, error: 'empty_body' });
  if (typeof body.website_url === 'string' && body.website_url.trim()) return res.status(200).json({ ok: true });

  const values = {};
  for (const [key, , max] of FIELDS) {
    if (body[key] != null && typeof body[key] !== 'string') return res.status(400).json({ ok: false, error: 'invalid_field' });
    const raw = (body[key] || '').replace(/\r\n?/g, '\n');
    const value = key === 'message' ? raw : raw.trim();
    if (value.length > max) return res.status(400).json({ ok: false, error: 'field_too_long' });
    values[key] = value;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) return res.status(400).json({ ok: false, error: 'invalid_email' });

  const token = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.LEAD_EMAIL_FROM || '').trim();
  if (!token || !from || !/^[^\r\n]*<[^<>\s]+@legibi\.ai>$/.test(from)) {
    console.error('lead_configuration_missing');
    return res.status(503).json({ ok: false, error: 'intake_not_configured' });
  }
  const form = typeof body.form === 'string' ? body.form.replace(/\s+/g, ' ').trim().slice(0, 100) : 'Website request';
  const lines = ['New enquiry from katyashalel.com', 'Form: ' + (form || 'Website request'), ''];
  for (const [key, label] of FIELDS) if (values[key]) lines.push(label + ': ' + values[key]);
  const message = {
    from, to: [RECIPIENT], reply_to: values.email,
    subject: 'Website enquiry: ' + (form || 'Website request'), text: lines.join('\n'),
  };
  // Both the key and provider payload stay identical on retry, including after a
  // cold start. No request time or IP is embedded. Resend deduplicates for 24h.
  const payload = JSON.stringify(message);
  const idempotencyKey = 'website-enquiry/v1/' + createHash('sha256').update(payload).digest('hex');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: payload, signal: AbortSignal.timeout(8000),
    });
    const result = await response.json();
    if (!response.ok || typeof result?.id !== 'string' || !result.id) {
      console.error('lead_delivery_rejected', { status: response.status });
      return res.status(502).json({ ok: false, error: 'delivery_failed' });
    }
    console.info('lead_accepted', { reference: result.id });
    return res.status(200).json({ ok: true, reference: result.id });
  } catch {
    // Never log provider exceptions, credentials or a visitor's message.
    console.error('lead_delivery_unconfirmed');
    return res.status(502).json({ ok: false, error: 'delivery_unconfirmed' });
  }
}

function isThrottled(ip) {
  const now = Date.now();
  const hits = (RATE.get(ip) || []).filter(time => now - time < WINDOW_MS);
  if (hits.length >= 5) return true;
  hits.push(now); RATE.set(ip, hits);
  if (RATE.size > 500) for (const [key, times] of RATE) if (times.every(time => now - time >= WINDOW_MS)) RATE.delete(key);
  return false;
}
