// app/api/get-product/route.js

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const asin = searchParams.get("asin");
  if (!asin) {
    return new Response(
      JSON.stringify({ error: "asin parameter is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const domain = searchParams.get("domain") || "fr";
  const key    = process.env.SCRAPINGDOG_API_KEY;

  // 1) Essai direct sur /product
  const productUrl = `https://api.scrapingdog.com/amazon/product?api_key=${key}&domain=${domain}&asin=${encodeURIComponent(asin)}`;
  let resp = await fetch(productUrl);
  let text = await resp.text();

  try {
    let data = JSON.parse(text);
    if (data.success === false || !data.data) {
      throw new Error("fallback");
    }
    // Renvoi direct des données produit
    return new Response(JSON.stringify(data.data), {
      status: resp.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    // 2) Fallback : appel /search si /product ne renvoie rien
    const searchUrl = `https://api.scrapingdog.com/amazon/search?api_key=${key}&domain=${domain}&query=${encodeURIComponent(asin)}&page=1`;
    let sr = await fetch(searchUrl);
    let st = await sr.text();
    try {
      let sd = JSON.parse(st);
      let first = sd.results && sd.results[0];
      if (!first) {
        return new Response(
          JSON.stringify({ error: "product not found via fallback" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      // Renvoi du premier résultat de search
      return new Response(JSON.stringify(first), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch {
      // Si le JSON est invalide
      return new Response(st, {
        status: 502,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
}
