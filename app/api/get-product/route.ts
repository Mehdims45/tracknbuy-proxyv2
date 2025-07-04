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

    const key = "VABBKW49AVXU3H9CV6ESZ39O7W3XVXJIJGB4GCV2FGOH9OTNHZU8VFN0D1AP6C4CCIBT70E0LBLU6CEH";
    if (!key) {
      console.error('SCRAPINGBEE_API_KEY missing');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }
    const target = url || `https://www.amazon.com/dp/${asin}`;

    const scrapingRes = await fetch(
      `https://app.scrapingbee.com/api/v1/scrape`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: key,
          url: target,
        }),
      }
    );

    if (!scrapingRes.ok) {
      const text = await scrapingRes.text();
      console.error('ScrapingBee error:', text);
      return NextResponse.json({ error: 'Scraping failed' }, { status: 502 });
    }
    const text = await scrapingRes.text();
    let scraped;
    try {
      scraped = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON from ScrapingBee. Response was:", text);
      return NextResponse.json({ error: "Scraping service returned invalid data." }, { status: 502 });
    }

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
