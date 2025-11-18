param(
  [string]$SiteRoot = (Resolve-Path "$PSScriptRoot\..\").Path
)

$ErrorActionPreference = 'Stop'

$gamesPath = Join-Path $SiteRoot 'assets\data\games.json'
if (!(Test-Path -LiteralPath $gamesPath)) { throw "games.json not found: $gamesPath" }
$json = Get-Content -Raw -LiteralPath $gamesPath | ConvertFrom-Json
if (-not ($json -is [System.Collections.IEnumerable])) { $json = @($json) }
$byId = @{}
foreach($g in $json){ if ($g.id) { $byId[$g.id] = $g } }

function TitleOf($g){
  if (-not $g) { return '' }
  try {
    if ($g.title -is [string]) { return $g.title }
    if ($g.title.'zh-CN') { return $g.title.'zh-CN' }
    if ($g.title.en) { return $g.title.en }
    foreach($v in $g.title.PSObject.Properties.Value){ if($v){ return [string]$v } }
  } catch {}
  return $g.id
}

$zhGamesDir = Join-Path $SiteRoot 'zh\games'
Get-ChildItem -LiteralPath $zhGamesDir -Filter *.html -File | ForEach-Object {
  $file = $_.FullName
  $slug = [IO.Path]::GetFileNameWithoutExtension($_.Name)
  $g = $byId[$slug]
  $html = [System.IO.File]::ReadAllText($file)
  $nl = [System.Environment]::NewLine
  $zhUrl = "https://funnygame.help/zh/games/$slug.html"
  $enUrl = "https://funnygame.help/games/$slug.html"

  # Fix canonical: set to zh URL; add if missing
  if ($html -match '(?i)<link\s+rel=["'']canonical["'']') {
    $html = [regex]::Replace($html,'(?i)<link\s+rel=["'']canonical["'']\s+href=["''][^"'']*["'']','<link rel="canonical" href="'+$zhUrl+'"')
  } else {
    $html = $html -replace '(?is)</head>','  <link rel="canonical" href="'+$zhUrl+'">' + $nl + '</head>'
  }

  # Ensure hreflang block exists
  if ($html -notmatch '(?i)rel=["'']alternate["'']\s+href=') {
    $inserts = '  <link rel="alternate" href="' + $enUrl + '" hreflang="en">' + $nl + '  <link rel="alternate" href="' + $zhUrl + '" hreflang="zh-CN">' + $nl + '  <link rel="alternate" href="' + $enUrl + '" hreflang="x-default">' + $nl
    $html = $html -replace '(?is)</head>', $inserts + '</head>'
  }

  # Inject JSON-LD (VideoGame)
  try {
    $name = TitleOf $g
    if (-not $name) { $name = $slug }
    $img = if ($g -and $g.thumbnail) { $g.thumbnail } else { '/assets/images/games/'+$slug+'.jpg' }
    $ld = '{"@context":"https://schema.org","@type":"VideoGame","name":"'+([System.Web.HttpUtility]::HtmlEncode($name))+'","url":"'+$zhUrl+'","image":"'+$img+'","applicationCategory":"Game","operatingSystem":"Browser"}'
    $ldBlock = $nl + '<!-- AUTO:SCHEMA START -->' + $nl + '<script type="application/ld+json">' + $ld + '</script>' + $nl + '<!-- AUTO:SCHEMA END -->' + $nl
    if ($html -match '<!-- AUTO:SCHEMA START -->.*<!-- AUTO:SCHEMA END -->') {
      $html = [regex]::Replace($html,'(?s)<!-- AUTO:SCHEMA START -->.*?<!-- AUTO:SCHEMA END -->',$ldBlock)
    } else {
      $html = $html -replace '(?s)</head>',$ldBlock + '</head>'
    }
  } catch {}

  [System.IO.File]::WriteAllText($file, $html, [Text.UTF8Encoding]::new($false))
}

Write-Host 'Fix zh pages: canonical + hreflang + JSON-LD applied.'
