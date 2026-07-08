export default async function handler(req, res) {
  const r = await fetch("https://d8j0ntlcm91z4.cloudfront.net/user_3G7eLtlI2FRc56F1KISDHpMfrwV/hf_20260708_150443_8769aa45-c235-44ae-93e2-135e7111afc1.png");
  if (!r.ok) { res.status(502).send("upstream"); return; }
  const buf = Buffer.from(await r.arrayBuffer());
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=604800");
  res.status(200).send(buf);
}
