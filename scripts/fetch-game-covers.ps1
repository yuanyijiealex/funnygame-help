<#
  Fetches cover images for games under /games by extracting archive.org identifiers
  from the iframe embed, downloading the corresponding thumbnail, and writing to
  /assets/images/games/<game-id>.jpg. Also updates og:image in game pages to use
  the local thumbnail.

  Usage:
    pwsh -File scripts/fetch-game-covers.ps1 [-Force]

  Notes:
    - Only processes pages whose iframe src contains archive.org/embed/<identifier>
    - <game-id> is the html filename without extension
    - If -Force is provided, existing thumbnails will be overwritten
#>

param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg){ Write-Host "[info] $msg" -ForegroundColor Cyan }
function Write-Warn($msg){ Write-Host "[warn] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[err ] $msg" -ForegroundColor Red }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
# repo root is parent of scripts dir
$repoRoot = Split-Path -Parent $root
Set-Location -LiteralPath $repoRoot

$gamesDir = Join-Path $repoRoot 'games'
$thumbDir = Join-Path $repoRoot 'assets/images/games'
New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null

$files = Get-ChildItem -LiteralPath $gamesDir -Filter '*.html' -File | Sort-Object Name
if (-not $files) { Write-Err "No game html found in $gamesDir"; exit 1 }

$downloaded = 0
$updatedOg = 0

foreach ($file in $files) {
  $id = [IO.Path]::GetFileNameWithoutExtension($file.Name)
  $content = Get-Content -LiteralPath $file.FullName -Raw
  # extract identifier after archive.org/embed/
  $m = [Regex]::Match($content, 'archive\\?\.org/embed/([^"''<>\s]+)')
  $outPath = Join-Path $thumbDir ("$id.jpg")
  if ($m.Success) {
    $archiveId = $m.Groups[1].Value
    $imgUrl = "https://archive.org/services/img/$archiveId"
    $needDownload = $Force -or -not (Test-Path -LiteralPath $outPath)
    if ($needDownload) {
      try {
        Write-Info ("Downloading cover for {0} <= {1}" -f $id, $imgUrl)
        Invoke-WebRequest -Uri $imgUrl -OutFile $outPath -UseBasicParsing -TimeoutSec 30
        $downloaded++
      } catch {
        Write-Warn ("Download failed for {0}: {1}" -f $id, $_.Exception.Message)
      }
    } else {
      Write-Info "Exists: assets/images/games/$id.jpg (skip)"
    }
  } else {
    Write-Warn "Skip $($file.Name): no archive.org embed detected"
  }

  # Update og:image to point to local thumbnail
  $newContent = $content
  $pattern = '(?i)(<meta\s+property="og:image"\s+content=")[^"]*(")'
  $newContent = [Regex]::Replace($newContent, $pattern, { param($m) $m.Groups[1].Value + "/assets/images/games/$id.jpg" + $m.Groups[2].Value })
  if ($newContent -ne $content) {
    Set-Content -LiteralPath $file.FullName -Value $newContent -Encoding UTF8
    $updatedOg++
    Write-Info ("Updated og:image in {0}" -f $file.Name)
  }
}

Write-Host ""; Write-Info "Done. Downloaded: $downloaded, Updated og:image: $updatedOg"
