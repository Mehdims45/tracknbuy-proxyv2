$body = @{
    asin = ""
    url = "https://www.amazon.com/dp/B082XSJT1R"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri 'https://tracknbuy-proxyv2.vercel.app/api/get-product' -Body $body -ContentType 'application/json'