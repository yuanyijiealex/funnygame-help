param(
  [Parameter(Mandatory=$true)][string]$Id,
  [Parameter(Mandatory=$true)][string]$TitleEn,
  [Parameter(Mandatory=$true)][string]$EmbedUrl,
  [string]$CategoriesCsv = '',
  [string]$ThumbnailUrl,
  [string]$TitleZh = '',
  [string]$TitleEs = '',
  [string]$TitleFr = ''
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$gamesJsonPath = Join-Path $root 'assets/data/games.json'
$gamesDir = Join-Path $root 'games'
$imagesDir = Join-Path $root 'assets/images/games'
$tplPath = Join-Path $root 'templates/game-template.html'

if(-not (Test-Path $gamesDir)) { New-Item -ItemType Directory -Force -Path $gamesDir | Out-Null }
if(-not (Test-Path $imagesDir)) { New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null }

if(-not (Test-Path $tplPath)) { throw "Template not found: $tplPath" }

# Normalize id
$Id = ($Id -replace '[^a-zA-Z0-9\-]','-').ToLower()

# Read games.json (array)
if(Test-Path $gamesJsonPath){
  $jsonText = Get-Content -Raw -Path $gamesJsonPath
  try { $games = $jsonText | ConvertFrom-Json } catch { throw "Invalid JSON in $gamesJsonPath" }
  if(-not ($games -is [System.Collections.IEnumerable])){ $games = @($games) }
} else {
  $games = @()
}

if($games | Where-Object { $_.id -eq $Id }){ throw "Game id already exists: $Id" }

# Prepare thumbnail
$thumbRel = "/assets/images/games/$Id.jpg"
$thumbPath = Join-Path $imagesDir "$Id.jpg"
if($ThumbnailUrl){
  try {
    if($ThumbnailUrl -match '^https?://'){
      Invoke-WebRequest -UseBasicParsing -Uri $ThumbnailUrl -OutFile $thumbPath -TimeoutSec 30 | Out-Null
    } else {
      Copy-Item -Force -Path $ThumbnailUrl -Destination $thumbPath
    }
  } catch {
    Write-Warning "Failed to fetch thumbnail, using placeholder. $_"
    $thumbRel = '/assets/images/game-placeholder.svg'
  }
} else {
  $thumbRel = '/assets/images/game-placeholder.svg'
}

# Build game object
$cats = $CategoriesCsv.Split(',') | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ }
$obj = [ordered]@{
  id = $Id
  title = @{ en = $TitleEn }
  embedUrl = $EmbedUrl
  thumbnail = $thumbRel
  categories = $cats
}
if($TitleZh){ $obj.title['zh-CN'] = $TitleZh }
if($TitleEs){ $obj.title['es']    = $TitleEs }
if($TitleFr){ $obj.title['fr']    = $TitleFr }

$games = @($games) + (New-Object psobject -Property $obj)
$games | ConvertTo-Json -Depth 6 | Set-Content -Path $gamesJsonPath -Encoding UTF8

# Generate game page
$tpl = Get-Content -Raw -Path $tplPath
$html = $tpl.Replace('{{ID}}', $Id)
$html = $html.Replace('{{TITLE_EN}}', $TitleEn)
$html = $html.Replace('{{EMBED_URL}}', $EmbedUrl)
$html = $html.Replace('{{THUMB}}', $thumbRel)

$outPath = Join-Path $gamesDir "$Id.html"
Set-Content -Path $outPath -Value $html -Encoding UTF8

Write-Output "ADDED: $Id"
Write-Output "PAGE:  $outPath"
Write-Output "THUMB: $thumbRel"



