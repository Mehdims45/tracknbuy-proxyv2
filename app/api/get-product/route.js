// app/api/get-product/route.js

// Helper function to extract ASIN from an Amazon URL
function extractAsinFromUrl(url) {
  const regex = /(?:dp|gp\/product|d|asin)\/([A-Z0-9]{10})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function POST(request) {
  // Extra safety check on method
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Only POST allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore, body stays empty
  }

  let { asin, url, threshold_price, cost_price, domain = 'fr' } = body;

  if (!asin && url) {
    asin = extractAsinFromUrl(url);
  }

  if (!asin && !url) {
    return new Response(
      JSON.stringify({ error: 'Please provide an ASIN or URL' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const key = process.env.SCRAPINGDOG_API_KEY;

  try {
    const productUrl =
      `https://api.scrapingdog.com/amazon/product?api_key=${key}&domain=${domain}&asin=${encodeURIComponent(asin)}`;
    const resp = await fetch(productUrl);
    const data = await resp.json();

    if (data.success === false || !data.data) {
      throw new Error('Product not found');
    }

    const d = data.data;
    const result = {
      price: d.price,
      title: d.title,
      image: d.image,
      asin: d.asin,
      threshold_price,
      cost_price
    };

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
