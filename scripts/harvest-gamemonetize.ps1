<#
  Harvests recent games from GameMonetize sitemap, extracts embedUrl
  (html5.gamemonetize.com / gamemonetize.co / gamemonetize.games),
  title and og:image, and outputs a CSV ready for bulk import.

  Usage:
    pwsh -File scripts/harvest-gamemonetize.ps1 -Count 50 -OutCsv temp/gamemonetize.csv
#>
param(
  [int]$Count = 50,
  [string]$OutCsv = 'temp/gamemonetize.csv'
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

  # Find GameMonetize iframe (supports .com/.co/.games variants)
  $m = [regex]::Match($html, '(?is)<iframe[^>]+src\s*=\s*"([^"]*(?:gamemonetize\.(?:com|co|games))[^"]+)"')
  if($m.Success){
    $embed = $m.Groups[1].Value
  } else {
    # Fallback: any absolute URL containing gamemonetize domain
    $m2 = [regex]::Match($html, '(?i)https?://[^"]*gamemonetize\.(?:com|co|games)[^"]*')
    if($m2.Success){ $embed = $m2.Value } else { return $null }
  }

  $title = (Get-Meta $html 'og:title'); if(-not $title){ $m2=[regex]::Match($html,'(?i)<title>([^<]+)</title>'); if($m2.Success){ $title=$m2.Groups[1].Value } }
  $ogimg = (Get-Meta $html 'og:image')

  # Derive id from page slug
  try { $u=[Uri]$url; $slug = ($u.AbsolutePath.TrimEnd('/').Split('/') | Select-Object -Last 1) } catch { $slug = $url }
  $id = ($slug -replace '[^a-zA-Z0-9\-]','-').ToLower()
  if([string]::IsNullOrWhiteSpace($title)) { $title = $id }

  $cat = ''
  return [PSCustomObject]@{ id=$id; title_en=$title; embed_url=$embed; categories=$cat; thumbnail_url=$ogimg }
}

$site = 'https://gamemonetize.com/sitemap.xml'
# Prefer concrete game detail URLs like https://gamemonetize.com/<slug>-game
$urls = Get-UrlsFromSitemap $site | Where-Object { $_ -match '^https?://gamemonetize\.com/[a-z0-9\-]+-game$' } | Select-Object -First ($Count*6)

$results = @()
foreach($u in $urls){
  $g = Harvest-Game $u
  if($g){ if(-not ($results | Where-Object { $_.id -eq $g.id })){ $results += $g } }
  if($results.Count -ge $Count){ break }
}

if(-not $results.Count){ Write-Error 'No games harvested.' }
$results | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "CSV written: $OutCsv ($($results.Count) rows)" -ForegroundColor Green
