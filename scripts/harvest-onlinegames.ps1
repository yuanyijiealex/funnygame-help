<#
  Harvests recent games from OnlineGames.io sitemap, extracts embedUrl (cloud.onlinegames.io index-og.html),
  title and og:image, and outputs a CSV ready for bulk import.

  Usage:
    pwsh -File scripts/harvest-onlinegames.ps1 -Count 50 -OutCsv temp/onlinegames.csv
#>
param(
  [int]$Count = 50,
  [string]$OutCsv = "temp/onlinegames.csv"
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FunnyGame/harvester' }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location -LiteralPath $root

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutCsv) | Out-Null

function Get-UrlsFromSitemap($url){
  try {
    $xml = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -Headers $headers | Select-Object -ExpandProperty Content
    # very rough URL extraction
    return ([regex]::Matches($xml, 'https?://[^<\s]+')).Value | Select-Object -Unique
  } catch { @() }
}

function Get-Meta($html, $prop){
  $pattern = [string]::Format('(?i)<meta\s+property="{0}"\s+content="([^"]+)"',[regex]::Escape($prop))
  $m = [regex]::Match($html, $pattern)
  if($m.Success){ return $m.Groups[1].Value }
  return $null
}

function Harvest-Game($url){
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -Headers $headers
  } catch { return $null }
  $html = $resp.Content
  # find cloud embed
  $m = [regex]::Match($html, '(?i)https?://cloud\.onlinegames\.io/[^"\'']*index-og\.html')
  if(-not $m.Success){ return $null }
  $embed = $m.Value
  $title = (Get-Meta $html 'og:title'); if(-not $title){ $m2=[regex]::Match($html,'(?i)<title>([^<]+)</title>'); if($m2.Success){ $title=$m2.Groups[1].Value } }
  $ogimg = (Get-Meta $html 'og:image')
  # derive id from url last segment
  try { $u=[Uri]$url; $slug = ($u.AbsolutePath.TrimEnd('/').Split('/') | Select-Object -Last 1) } catch { $slug = $url }
  $id = ($slug -replace '[^a-zA-Z0-9\-]','-').ToLower()
  if([string]::IsNullOrWhiteSpace($title)) { $title = $id }
  $cat = 'action' # default category if unknown
  return [PSCustomObject]@{ id=$id; title_en=$title; embed_url=$embed; categories=$cat; thumbnail_url=$ogimg }
}

$site = 'https://www.onlinegames.io/sitemap.xml'
# collect candidate game URLs from sitemap; include per-game pages and exclude site root and obvious feeds
$urls = Get-UrlsFromSitemap $site | Where-Object {
  try { $u = [Uri]$_ } catch { return $false }
  if($u.Host -notmatch 'onlinegames\.io') { return $false }
  $p = $u.AbsolutePath.Trim()
  if($p -eq '/' -or $p -like '/*feed*' -or $p -like '/*tag*' -or $p -like '/*category*') { return $false }
  # most game pages are like /slug/
  return $p.EndsWith('/') -and ($p.Split('/').Count -ge 2)
} | Select-Object -Unique | Select-Object -First ($Count*6)

$results = @()
foreach($u in $urls){
  $g = Harvest-Game $u
  if($g){
    if(-not ($results | Where-Object { $_.id -eq $g.id })){
      $results += $g
    }
  }
  if($results.Count -ge $Count){ break }
}

if(-not $results.Count){ Write-Error 'No games harvested.' }
$results | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "CSV written: $OutCsv ($($results.Count) rows)" -ForegroundColor Green


