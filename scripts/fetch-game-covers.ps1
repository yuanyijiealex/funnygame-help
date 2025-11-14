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
$dataJson = Join-Path $repoRoot 'assets/data/games.json'
New-Item -ItemType Directory -Force -Path $thumbDir | Out-Null

$files = Get-ChildItem -LiteralPath $gamesDir -Filter '*.html' -File | Sort-Object Name
if (-not $files) { Write-Err "No game html found in $gamesDir"; exit 1 }

$downloaded = 0
$updatedOg = 0

function Download-File($url, $out){
  try {
    $headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PowerShell/7 fetch-game-covers' }
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 30 -Headers $headers
    return $true
  } catch {
    return $false
  }
}

function Is-ProbablyImage($path){
  if (!(Test-Path -LiteralPath $path)) { return $false }
  try {
    $len = (Get-Item -LiteralPath $path).Length
    if ($len -lt 4000) { return $false }
    $bytes = [System.IO.File]::ReadAllBytes($path)
    if ($bytes.Length -lt 4) { return $false }
    if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8) { return $true } # JPG
    if ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50) { return $true } # PNG
    return $true
  } catch { return $false }
}

# Common headers for external requests
$wcHeaders = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FunnyGame/cover-fetch' }

function Get-WikipediaImage($query){
  if ([string]::IsNullOrWhiteSpace($query)) { return $null }
  try {
    $q = [System.Uri]::EscapeDataString($query)
    $url1 = "https://en.wikipedia.org/api/rest_v1/page/summary/$q"
    $resp1 = Invoke-WebRequest -Uri $url1 -UseBasicParsing -TimeoutSec 20 -Headers $wcHeaders
    if ($resp1.StatusCode -ge 200 -and $resp1.StatusCode -lt 300) {
      $j = $resp1.Content | ConvertFrom-Json -Depth 20
      if ($j.thumbnail -and $j.thumbnail.source) { return $j.thumbnail.source }
      if ($j.originalimage -and $j.originalimage.source) { return $j.originalimage.source }
    }
  } catch {}
  try {
    $url2 = "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=1&prop=pageimages&piprop=original&gsrsearch=" + [System.Uri]::EscapeDataString($query)
    $resp2 = Invoke-WebRequest -Uri $url2 -UseBasicParsing -TimeoutSec 20 -Headers $wcHeaders
    if ($resp2.StatusCode -ge 200 -and $resp2.StatusCode -lt 300) {
      $j2 = $resp2.Content | ConvertFrom-Json -Depth 50
      if ($j2.query -and $j2.query.pages) {
        foreach ($k in $j2.query.pages.PSObject.Properties.Name) {
          $p = $j2.query.pages.$k
          if ($p.original -and $p.original.source) { return $p.original.source }
          if ($p.thumbnail -and $p.thumbnail.source) { return $p.thumbnail.source }
        }
      }
    }
  } catch {}
  return $null
}

function Clean-GameTitle([string]$id, $entry){
  try {
    if ($entry -and $entry.title) {
      if ($entry.title.'en') { return [string]$entry.title.'en' }
      if ($entry.title.'zh-CN') { return [string]$entry.title.'zh-CN' }
      foreach($v in $entry.title.PSObject.Properties.Value){ if($v){ return [string]$v } }
    }
  } catch {}
  $t = ($id -replace '[-_]+',' ') -replace '\s+html$',''
  $t = $t -replace 'prince of persia.*','Prince of Persia'
  $t = $t -replace 'tetris.*','Tetris'
  $t = $t -replace 'lotus iii.*','Lotus III The Ultimate Challenge'
  return $t
}

$gamesIndex = $null
if (Test-Path -LiteralPath $dataJson) {
  try { $gamesIndex = (Get-Content -LiteralPath $dataJson -Raw | ConvertFrom-Json -Depth 40) } catch {}
}

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
      Write-Info ("Downloading cover for {0} <= {1}" -f $id, $imgUrl)
      $ok = Download-File $imgUrl $outPath
      if (-not $ok -or -not (Is-ProbablyImage $outPath)) {
        $alt = "https://archive.org/download/$archiveId/__ia_thumb.jpg"
        Write-Warn ("Primary failed/invalid for {0}, trying {1}" -f $id, $alt)
        $ok2 = Download-File $alt $outPath
        if (-not $ok2 -or -not (Is-ProbablyImage $outPath)) {
          # Final fallback: use metadata API to find a jpg/png file
          try {
            $metaUrl = "https://archive.org/metadata/$archiveId"
            Write-Warn ("Fallback to metadata for {0}: {1}" -f $id, $metaUrl)
            $meta = Invoke-WebRequest -Uri $metaUrl -UseBasicParsing -TimeoutSec 30 -Headers @{ 'User-Agent'='Mozilla/5.0' } | Select-Object -ExpandProperty Content
            $fileMatch = [Regex]::Matches($meta, '"name"\s*:\s*"([^"]+\.(jpg|jpeg|png))"',[Text.RegularExpressions.RegexOptions]::IgnoreCase) | ForEach-Object { $_.Groups[1].Value } | Select-Object -First 1
            if ($fileMatch) {
              $dl = "https://archive.org/download/$archiveId/$fileMatch"
              Write-Info ("Metadata image for {0} => {1}" -f $id, $dl)
              $ok3 = Download-File $dl $outPath
              if ($ok3 -and (Is-ProbablyImage $outPath)) { $downloaded++ } else { Write-Warn ("Metadata image failed for {0}" -f $id) }
            } else {
              Write-Warn ("No jpg/png found in metadata for {0}" -f $id)
            }
          } catch { Write-Warn ("Metadata fetch failed for {0}" -f $id) }
        } else { $downloaded++ }
      } else { $downloaded++ }
    } else {
      Write-Info "Exists: assets/images/games/$id.jpg (skip)"
    }
  } else {
    # Try from games.json for non-archive sources
    $entry = $null
    if ($gamesIndex) { $entry = $gamesIndex | Where-Object { $_.id -eq $id } | Select-Object -First 1 }
    $downloadedFrom = $null
    if ($entry -and $entry.embedUrl) {
      try {
        Write-Info ("Fetch meta for {0} from embedUrl" -f $id)
        $resp = Invoke-WebRequest -Uri $entry.embedUrl -UseBasicParsing -TimeoutSec 30 -Headers @{ 'User-Agent'='Mozilla/5.0' }
        $html = $resp.Content
        $mm = [Regex]::Match($html, '(?i)<meta\s+property=["'']og:image["'']\s+content=["'']([^"'']+)["'']')
        if ($mm.Success) {
          $img = $mm.Groups[1].Value
          if ($img -notmatch '^https?://') {
            $u = [System.Uri]$entry.embedUrl
            $img = (New-Object System.Uri($u, $img)).AbsoluteUri
          }
          Write-Info ("Downloading cover for {0} <= {1}" -f $id, $img)
          if (Download-File $img $outPath -and (Is-ProbablyImage $outPath)) { $downloadedFrom = 'embed' }
        }
      } catch {}
    }
    if (-not $downloadedFrom -and $entry -and $entry.thumbnail -and ($entry.thumbnail -notmatch 'game-placeholder')) {
      $img = $entry.thumbnail
      if ($img -notmatch '^https?://') { $img = "https://funnygame.help$img" }
      Write-Info ("Downloading cover for {0} <= {1}" -f $id, $img)
      if (Download-File $img $outPath -and (Is-ProbablyImage $outPath)) { $downloadedFrom = 'thumbnail' }
    }
    if ($downloadedFrom) { $downloaded++ } else { Write-Warn "Skip $($file.Name): no archive.org embed detected" }
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
