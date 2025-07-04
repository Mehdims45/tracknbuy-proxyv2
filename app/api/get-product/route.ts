import { NextResponse } from 'next/server';

function extractAsinFromUrl(url: string) {
  const regex = /(?:dp|gp\/product|d|asin)\/([A-Z0-9]{10})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  try {
    const { asin: bodyAsin, url, threshold_price, cost_price } = await request.json();
    let asin = bodyAsin;
    if (!asin && url) {
      asin = extractAsinFromUrl(url);
    }

    if (!asin && !url) {
      return NextResponse.json(
        { error: 'asin or url is required' },
        { status: 400 }
      );
    }

    const key = process.env.SCRAPINGDOG_API_KEY;
    const target = url || `https://www.amazon.com/dp/${asin}`;
    const scrapingRes = await fetch(
      `https://api.scrapingdog.com/scrape?api_key=${key}&url=${encodeURIComponent(target)}`
    );
    const scraped = await scrapingRes.json();

    return NextResponse.json({
      price: scraped.price,
      title: scraped.title,
      image: scraped.image,
      asin: scraped.asin,
      threshold_price,
      cost_price
    });
  } catch (err: any) {
    console.error('Error in app/api/get-product:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
