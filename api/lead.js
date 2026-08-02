// Lead intake endpoint. Accepts a POST from the request forms on katyashalel.com
// and delivers the enquiry to Telegram. No database, no third-party form service:
// the site owns the intake layer.
//
// Required environment variables (set in Vercel, never in the repo):
//   TG_BOT_TOKEN  bot token for @SuperLegiBot
//   TG_LEAD_CHAT  numeric chat id that receives the enquiries

const FIELDS = [
  ["name", "Name", 120],
  ["email", "Email", 160],
  ["company", "Company or brand", 160],
  ["site", "Website", 300],
  ["entities", "Related entities", 80],
  ["markets", "Markets and languages", 200],
  ["source", "How they found this", 200],
  ["message", "Message", 3000],
];

const RATE = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://katyashalel.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (isThrottled(ip)) {
    return res.status(429).json({ ok: false, error: "too_many_requests" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: "bad_json" });
    }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ ok: false, error: "empty_body" });
  }

  // Honeypot: real people never fill a hidden field.
  if (typeof body.website_url === "string" && body.website_url.trim() !== "") {
    return res.status(200).json({ ok: true });
  }

  const email = clean(body.email, 160);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ ok: false, error: "invalid_email" });
  }

  const token = process.env.TG_BOT_TOKEN;
  const chat = process.env.TG_LEAD_CHAT;
  if (!token || !chat) {
    return res.status(500).json({ ok: false, error: "intake_not_configured" });
  }

  const form = clean(body.form, 60) || "request";
  const lines = [`<b>New enquiry</b> · ${esc(form)}`, ""];
  for (const [key, label, max] of FIELDS) {
    const value = clean(body[key], max);
    if (value) lines.push(`<b>${esc(label)}:</b> ${esc(value)}`);
  }
  lines.push("", `<i>${new Date().toISOString()} · ${esc(ip)}</i>`);

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: lines.join("\n").slice(0, 4000),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const d = await r.json();
    if (!d.ok) {
      console.error("telegram_error", d.description);
      return res.status(502).json({ ok: false, error: "delivery_failed" });
    }
  } catch (e) {
    console.error("telegram_exception", e && e.message);
    return res.status(502).json({ ok: false, error: "delivery_failed" });
  }

  return res.status(200).json({ ok: true });
}

function clean(v, max) {
  if (typeof v !== "string") return "";
  return v.replace(/\s+/g, " ").trim().slice(0, max);
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isThrottled(ip) {
  const now = Date.now();
  const hits = (RATE.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  RATE.set(ip, hits);
  if (RATE.size > 500) {
    for (const [k, v] of RATE) {
      if (v.every((t) => now - t > WINDOW_MS)) RATE.delete(k);
    }
  }
  return hits.length > MAX_PER_WINDOW;
}
