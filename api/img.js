export default async function handler(req, res) {
  const u = req.query.u || "";
  if (!/^https:\/\/d8j0ntlcm91z4\.cloudfront\.net\//.test(u)) {
    res.status(400).send("bad url"); return;
  }
  const r = await fetch(u);
  if (!r.ok) { res.status(502).send("upstream " + r.status); return; }
  const buf = Buffer.from(await r.arrayBuffer());
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=604800");
  res.status(200).send(buf);
}
