param(
  [string]$SiteHost = 'funnygame.help',
  [string]$Key = '2d825571af7849398cae10ac72fc2d57',
  [string]$Sitemap = 'https://funnygame.help/sitemap.xml',
  [int]$BatchSize = 100,
  [int]$DelayMs = 200
)

$ErrorActionPreference = 'Stop'

function Get-UrlsFromSitemap([string]$smap){
  Write-Host "Loading sitemap: $smap"
  $resp = Invoke-WebRequest -Uri $smap -UseBasicParsing -TimeoutSec 60
  [xml]$xml = $resp.Content
  $list = @()
  if ($xml.urlset){
    $xml.urlset.url | ForEach-Object { if($_.loc){ $list += ($_.loc.Trim()) } }
  } elseif ($xml.sitemapindex){
    # If it's a sitemap index, expand children
    $xml.sitemapindex.sitemap | ForEach-Object {
      $child = $_.loc
      if ($child){
        try {
          $childUrls = Get-UrlsFromSitemap -smap $child
          if ($childUrls){ $list += $childUrls }
        } catch { Write-Warning "Failed child sitemap: $child - $($_.Exception.Message)" }
      }
    }
  }
  # Normalize and keep only same host
  $prefix = "https://${SiteHost}/"
  $list = $list | Where-Object { $_ -like "$prefix*" } | Select-Object -Unique
  return $list
}

function Submit-IndexNow([string[]]$urls){
  if (-not $urls -or $urls.Count -eq 0){ return }
  $keyLocation = "https://${SiteHost}/$Key.txt"
  $body = @{ host=$SiteHost; key=$Key; keyLocation=$keyLocation; urlList=$urls } | ConvertTo-Json -Depth 4
  try {
    $r = Invoke-WebRequest -Uri 'https://www.bing.com/indexnow' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 60
    Write-Host ("Posted {0} URLs -> {1}" -f $urls.Count, $r.StatusCode) -ForegroundColor Green
  } catch {
    Write-Host ("Posted {0} URLs -> ERROR: {1}" -f $urls.Count, $_.Exception.Message) -ForegroundColor Red
  }
}

try {
  $urls = Get-UrlsFromSitemap -smap $Sitemap
  Write-Host ("Total URLs to submit: {0}" -f $urls.Count)
  for($i=0; $i -lt $urls.Count; $i += $BatchSize){
    $chunk = $urls[$i..([Math]::Min($i+$BatchSize-1, $urls.Count-1))]
    Submit-IndexNow -urls $chunk
    Start-Sleep -Milliseconds $DelayMs
  }
  Write-Host 'Done.'
} catch {
  Write-Error $_.Exception.Message
  exit 1
}

