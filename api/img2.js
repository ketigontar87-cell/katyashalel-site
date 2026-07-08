export default async function handler(req, res) {
  const r = await fetch("https://d8j0ntlcm91z4.cloudfront.net/user_3G7eLtlI2FRc56F1KISDHpMfrwV/hf_20260708_150622_87847e13-7bba-4d87-a7bf-9a8ae84bd77a.png");
  if (!r.ok) { res.status(502).send("upstream"); return; }
  const buf = Buffer.from(await r.arrayBuffer());
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=604800");
  res.status(200).send(buf);
}
