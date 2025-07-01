# create-route-fallback.ps1

# Variables
$dir  = "app/api/get-product"
$file = "$dir/route.js"
$key  = "686149de2b7cec73d5b4d977"

# 1) Crée le dossier si besoin
if (-not (Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# 2) Génère le handler avec fallback search
$code = @"
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const asin = searchParams.get('asin');
  if (!asin) {
    return new Response(JSON.stringify({ error: 'asin parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const domain = searchParams.get('domain') || 'fr';
  const key    = process.env.SCRAPINGDOG_API_KEY || '${key}';

  // Tentative sur endpoint product
  const productUrl = \`https://api.scrapingdog.com/amazon/product?api_key=\${key}&domain=\${domain}&asin=\${encodeURIComponent(asin)}\`;
  let resp = await fetch(productUrl);
  let text = await resp.text();

  try {
    let data = JSON.parse(text);
    if (data.success === false || !data.data) {
      throw new Error('fallback');
    }
    return new Response(JSON.stringify(data.data), {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    // Fallback : search
    const searchUrl = \`https://api.scrapingdog.com/amazon/search?api_key=\${key}&domain=\${domain}&query=\${encodeURIComponent(asin)}&page=1\`;
    const sr = await fetch(searchUrl);
    const st = await sr.text();
    try {
      const sd = JSON.parse(st);
      const first = sd.results && sd.results[0];
      if (!first) {
        return new Response(JSON.stringify({ error: 'product not found via fallback' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(first), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      return new Response(st, { status: 502, headers: { 'Content-Type': 'text/plain' } });
    }
  }
}
"@

# 3) Écrit le fichier en UTF8
$code | Out-File -FilePath $file -Encoding UTF8

Write-Host "✅ $file créé/mis à jour avec fallback logic !"
