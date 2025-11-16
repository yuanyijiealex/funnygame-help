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
  $OutCsv = Join-Path $sourcesDir ("google-top-sites-" + $date + ".csv")
}
$headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FunnyGame/harvester' }

function Parse-GoogleLinks([string]$html){
  $links = @()
  foreach($m in [regex]::Matches($html,'/url\?q=([^&]+)&[^\"]*')){
    try { $u = [Uri]([System.Web.HttpUtility]::UrlDecode($m.Groups[1].Value)) } catch { continue }
    if($u.Scheme -notin @('http','https')){ continue }
    if($u.Host -match 'google\.|webcache|translate\.google'){ continue }
    $links += $u.AbsoluteUri
  }
  # Also capture organic card links with <a href="https://...">
  foreach($m in [regex]::Matches($html,'\shref=\"(https?://[^\"]+)\"')){
    try { $u = [Uri]$m.Groups[1].Value } catch { continue }
    if($u.Host -match 'google\.|webcache|translate\.google'){ continue }
    $links += $u.AbsoluteUri
  }
  return $links | Select-Object -Unique
}

$results = @()
$start = 0
while($results.Count -lt $Count -and $start -lt 200){
  $qs = [System.Web.HttpUtility]::UrlEncode($Query)
  $url = "https://www.google.com/search?q=$qs&num=10&start=$start&hl=en&gbv=1&pws=0"
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Headers $headers -TimeoutSec 30
    $html = $resp.Content
    $file = Join-Path $rawDir ("google-" + ($Query -replace '[^a-z0-9]','-').ToLower() + "-$start.html")
    $html | Set-Content -Path $file -Encoding UTF8
    $links = Parse-GoogleLinks $html
    foreach($lnk in $links){
      try { $u=[Uri]$lnk; $domain = $u.Host.ToLower() } catch { continue }
      if($domain -match 'google\.|youtube\.com|facebook\.com|twitter\.com|x\.com|reddit\.com|wikipedia\.org'){ continue }
      if(-not ($results | Where-Object { $_.domain -eq $domain })){
        $results += [pscustomobject]@{ rank = ($results.Count+1); domain=$domain; url=$u.GetLeftPart('Authority'); source='google'; query=$Query }
      }
      if($results.Count -ge $Count){ break }
    }
  } catch {
    # swallow and continue
  }
  $start += 10
}
if(-not $results.Count){ Write-Warning 'No results parsed from Google.' }
$results | Select-Object rank,domain,url,source,query | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "Saved: $OutCsv ($($results.Count) sites)" -ForegroundColor Green
