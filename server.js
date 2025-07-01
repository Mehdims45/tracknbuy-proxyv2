// server.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";

const KEY = process.env.SCRAPINGDOG_API_KEY;
if (!KEY) {
  console.error("❌ SCRAPINGDOG_API_KEY missing");
  process.exit(1);
}

const app = express();

app.get("/api/get-product", async (req, res) => {
  const { asin, domain = "fr" } = req.query;
  if (!asin) return res.status(400).json({ error: "asin required" });

  const productUrl = `https://api.scrapingdog.com/amazon/product?api_key=${KEY}&domain=${domain}&asin=${encodeURIComponent(asin)}`;
  try {
    const r = await fetch(productUrl);
    const j = await r.json();
    if (j.success === false || !j.data) throw new Error();
    return res.status(r.status).json(j.data);
  } catch {
    const searchUrl = `https://api.scrapingdog.com/amazon/search?api_key=${KEY}&domain=${domain}&query=${encodeURIComponent(asin)}&page=1`;
    const r2 = await fetch(searchUrl);
    const j2 = await r2.json();
    const first = j2.results && j2.results[0];
    if (!first) return res.status(404).json({ error: "not found" });
    return res.json(first);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
