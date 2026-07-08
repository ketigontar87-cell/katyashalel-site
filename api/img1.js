export default async function handler(req, res) {
  const r = await fetch("https://d8j0ntlcm91z4.cloudfront.net/user_3G7eLtlI2FRc56F1KISDHpMfrwV/hf_20260708_150417_31b650b0-273f-46f0-a44d-0bfbce126810.png");
  if (!r.ok) { res.status(502).send("upstream"); return; }
  const buf = Buffer.from(await r.arrayBuffer());
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=604800");
  res.status(200).send(buf);
}
