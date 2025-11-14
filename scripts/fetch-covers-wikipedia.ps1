<#
  Fallback cover fetcher via Wikipedia.
  For each game in assets/data/games.json, if local cover is missing or too small (<5KB),
  query English Wikipedia for a representative image and save as /assets/images/games/<id>.jpg

  Usage:
    pwsh -File scripts/fetch-covers-wikipedia.ps1 [-OnlyId id1,id2]
#>
param(
  [string]$OnlyId
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $root
Set-Location -LiteralPath $repoRoot
$jsonPath = 'assets/data/games.json'
$imgDir = 'assets/images/games'
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null

function Is-SmallOrMissing($path){ if(!(Test-Path -LiteralPath $path)){ return $true }; try { (Get-Item -LiteralPath $path).Length -lt 5000 } catch { $true } }

$wcHeaders = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FunnyGame/wiki-fallback' }
function Get-WikipediaImage($query){
  if ([string]::IsNullOrWhiteSpace($query)) { return $null }
  try {
    $q = [System.Uri]::EscapeDataString($query)
    $u = "https://en.wikipedia.org/api/rest_v1/page/summary/$q"
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 20 -Headers $wcHeaders
    $j = $r.Content | ConvertFrom-Json -Depth 20
    if ($j.originalimage -and $j.originalimage.source) { return $j.originalimage.source }
    if ($j.thumbnail -and $j.thumbnail.source) { return $j.thumbnail.source }
  } catch {}
  try {
    $u2 = "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=1&prop=pageimages&piprop=original&gsrsearch=" + [System.Uri]::EscapeDataString($query)
    $r2 = Invoke-WebRequest -Uri $u2 -UseBasicParsing -TimeoutSec 20 -Headers $wcHeaders
    $j2 = $r2.Content | ConvertFrom-Json -Depth 50
    if ($j2.query -and $j2.query.pages) {
      foreach ($k in $j2.query.pages.PSObject.Properties.Name) {
        $p = $j2.query.pages.$k
        if ($p.original -and $p.original.source) { return $p.original.source }
        if ($p.thumbnail -and $p.thumbnail.source) { return $p.thumbnail.source }
      }
    }
  } catch {}
  return $null
}

function Guess-Title($id, $entry){
  try { if($entry -and $entry.title){ if($entry.title.'en'){ return [string]$entry.title.'en' }; foreach($v in $entry.title.PSObject.Properties.Value){ if($v){ return [string]$v } } } } catch {}
  $t = ($id -replace '[-_]+',' ')
  $t = $t -replace 'prince of persia.*','Prince of Persia'
  $t = $t -replace 'tetris.*','Tetris'
  $t = $t -replace 'lotus iii.*','Lotus III The Ultimate Challenge'
  return $t
}

if(!(Test-Path -LiteralPath $jsonPath)){ Write-Host "games.json not found" -ForegroundColor Red; exit 1 }
$list = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json -Depth 40
if($OnlyId){ $ids = $OnlyId.Split(','); $list = $list | Where-Object { $ids -contains $_.id } }

$done=0
foreach($g in $list){
  $id = $g.id; if([string]::IsNullOrWhiteSpace($id)){ continue }
  $out = Join-Path $imgDir ("$id.jpg")
  if(-not (Is-SmallOrMissing $out)){ continue }
  $title = Guess-Title $id $g
  $img = Get-WikipediaImage $title
  if($img){
    try {
      Write-Host "[wiki] $id <= $img" -ForegroundColor Cyan
      Invoke-WebRequest -Uri $img -OutFile $out -UseBasicParsing -TimeoutSec 30 -Headers $wcHeaders
      $done++
    } catch { Write-Host ("[warn] download failed for {0}: {1}" -f $id, $_.Exception.Message) -ForegroundColor Yellow }
  }
}
Write-Host "Completed Wikipedia fallback: $done files written."
