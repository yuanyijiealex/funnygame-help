<#
  Harvest prioritized games from GameMonetize (editor picks + sitemap fill),
  extract embedUrl/title/og:image and output a CSV for bulk import.

  Priority source order:
  1) https://gamemonetize.com/games-editor-picks
  2) Fill from sitemap if not enough

  Usage:
    pwsh -File scripts/harvest-gamemonetize-top.ps1 -Count 100 -OutCsv temp/gamemonetize-top.csv
#>
param(
  [int]$Count = 100,
  [string]$OutCsv = 'temp/gamemonetize-top.csv'
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FunnyGame/harvester' }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location -LiteralPath $root
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutCsv) | Out-Null

function Get-UrlsFromHtml($html){
  return ([regex]::Matches($html, 'https?://gamemonetize\.com/[a-z0-9\-]+-game')).Value | Select-Object -Unique
}

function Get-UrlsFromSitemap($url){
  try {
    $xml = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -Headers $headers | Select-Object -ExpandProperty Content
    return ([regex]::Matches($xml, 'https?://gamemonetize\.com/[a-z0-9\-]+-game')).Value | Select-Object -Unique
  } catch { @() }
}

function Get-Meta($html, $prop){
  $pattern = [string]::Format('(?i)<meta\s+property="{0}"\s+content="([^"]+)"',[regex]::Escape($prop))
  $m = [regex]::Match($html, $pattern)
  if($m.Success){ return $m.Groups[1].Value }
  return $null
}

function Harvest-Game($url){
  try { $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -Headers $headers } catch { return $null }
  $html = $resp.Content
  $m = [regex]::Match($html, '(?is)<iframe[^>]+src\s*=\s*"([^"]*(?:gamemonetize\.(?:com|co|games))[^"]+)"')
  if($m.Success){ $embed = $m.Groups[1].Value } else {
    $m2 = [regex]::Match($html, "(?i)https?://[^`"\']*gamemonetize\.(?:com|co|games)[^`"\']*")
    if($m2.Success){ $embed = $m2.Value } else { return $null }
  }
  $title = (Get-Meta $html 'og:title'); if(-not $title){ $m3=[regex]::Match($html,'(?i)<title>([^<]+)</title>'); if($m3.Success){ $title=$m3.Groups[1].Value } }
  $ogimg = (Get-Meta $html 'og:image')
  try { $u=[Uri]$url; $slug = ($u.AbsolutePath.TrimEnd('/').Split('/') | Select-Object -Last 1) } catch { $slug = $url }
  $id = ($slug -replace '[^a-zA-Z0-9\-]','-').ToLower()
  if([string]::IsNullOrWhiteSpace($title)) { $title = $id }
  return [PSCustomObject]@{ id=$id; title_en=$title; embed_url=$embed; categories=''; thumbnail_url=$ogimg }
}

# 1) Editor picks
$editUrl = 'https://gamemonetize.com/games-editor-picks'
try { $editHtml = Invoke-WebRequest -Uri $editUrl -UseBasicParsing -TimeoutSec 30 -Headers $headers | Select-Object -ExpandProperty Content } catch { $editHtml = '' }
$urls = @()
if($editHtml){ $urls += (Get-UrlsFromHtml $editHtml) }

# 2) Fill from sitemap if needed
if($urls.Count -lt $Count){
  $site = 'https://gamemonetize.com/sitemap.xml'
  $urls2 = Get-UrlsFromSitemap $site
  foreach($u in $urls2){ if($urls.Count -ge $Count*3){ break }; if(-not ($urls -contains $u)){ $urls += $u } }
}

$urls = $urls | Select-Object -Unique
$results = @()
foreach($u in $urls){
  $g = Harvest-Game $u
  if($g){ if(-not ($results | Where-Object { $_.id -eq $g.id })){ $results += $g } }
  if($results.Count -ge $Count){ break }
}

if(-not $results.Count){ Write-Error 'No games harvested.' }
$results | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "CSV written: $OutCsv ($($results.Count) rows)" -ForegroundColor Green

