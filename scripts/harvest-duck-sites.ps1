param(
  [int]$Count = 100,
  [string]$Query = 'online games',
  [string]$OutCsv = ''
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$sourcesDir = Join-Path $root 'sources'
New-Item -ItemType Directory -Force -Path $sourcesDir | Out-Null
$rawDir = Join-Path $sourcesDir 'raw'
New-Item -ItemType Directory -Force -Path $rawDir | Out-Null
if([string]::IsNullOrWhiteSpace($OutCsv)){
  $date = Get-Date -Format 'yyyyMMdd'
  $OutCsv = Join-Path $sourcesDir ("duck-top-sites-" + $date + ".csv")
}
$headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FunnyGame/harvester' }

function Parse-Links([string]$html){
  $links = @()
  foreach($m in [regex]::Matches($html,'\\shref=\"(https?://[^\"]+)\"')){
    $url = $m.Groups[1].Value
    if($url -match 'duckduckgo\.com' -or $url -match '^https?://r\.') { continue }
    try { $u=[Uri]$url } catch { continue }
    $links += $u.AbsoluteUri
  }
  return $links | Select-Object -Unique
}

$results = @()
$next = "https://html.duckduckgo.com/html/?q=" + [System.Web.HttpUtility]::UrlEncode($Query)
while($results.Count -lt $Count -and $next){
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri $next -Headers $headers -TimeoutSec 30
  } catch { break }
  $html = $resp.Content
  $file = Join-Path $rawDir ("ddg-" + ($Query -replace '[^a-z0-9]','-').ToLower() + "-" + ($results.Count) + ".html")
  $html | Set-Content -Path $file -Encoding UTF8
  $links = Parse-Links $html
  foreach($lnk in $links){
    try { $u=[Uri]$lnk; $domain=$u.Host.ToLower() } catch { continue }
    if(-not ($results | Where-Object { $_.domain -eq $domain })){
      $results += [pscustomobject]@{ rank=($results.Count+1); domain=$domain; url=$u.GetLeftPart('Authority'); source='duckduckgo'; query=$Query }
    }
    if($results.Count -ge $Count){ break }
  }
  # find next link
  $m = [regex]::Match($html,'<a[^>]+rel=\"next\"[^>]+href=\"([^\"]+)\"')
  if($m.Success){ $href = $m.Groups[1].Value; if($href -notmatch '^https?://'){ $next = 'https://html.duckduckgo.com' + $href } else { $next = $href } } else { $next = $null }
}
$results | Select-Object rank,domain,url,source,query | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "Saved: $OutCsv ($($results.Count) sites)" -ForegroundColor Green
