param(
  [string]$BulkCsv = 'temp/github-bulk.csv',
  [string]$GithubCsv,
  [int]$Max = 40
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$bulk = Import-Csv -Path (Join-Path $root $BulkCsv)
if(-not $GithubCsv){
  $GithubCsv = Get-ChildItem -LiteralPath (Join-Path $root 'sources') -Filter 'github-games-*.csv' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
$repos = @{}
if(Test-Path $GithubCsv){
  foreach($r in (Import-Csv -Path $GithubCsv)){
    $demo = $r.candidate_demo
    if([string]::IsNullOrWhiteSpace($demo)) { continue }
    $repos[$demo] = $r
  }
}
function Get-OgImage([string]$url){
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 20
  } catch { return $null }
  $html = $resp.Content
  $patterns = @(
    '<meta[^>]+property="og:image"[^>]+content="([^"]+)"',
    '<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"',
    '<link[^>]+rel="icon"[^>]+href="([^"]+)"',
    '<link[^>]+rel="apple-touch-icon[^"]*"[^>]+href="([^"]+)"'
  )
  foreach($pat in $patterns){
    $m = [regex]::Match($html, $pat, 'IgnoreCase')
    if($m.Success){
      $val = $m.Groups[1].Value
      if($val -notmatch '^https?://'){
        try { $u=[Uri]$url; if($val.StartsWith('/')){ $val = $u.Scheme + '://' + $u.Host + $val } else { $val = [Uri]::new($u, $val).AbsoluteUri } } catch {}
      }
      return $val
    }
  }
  return $null
}
$gPath = Join-Path $root 'assets/data/games.json'
$games = Get-Content -Raw -Path $gPath | ConvertFrom-Json
$cnt=0
foreach($b in ($bulk | Select-Object -First $Max)){
  $id = $b.id
  $game = $games | Where-Object { $_.id -eq $id }
  if(-not $game){ continue }
  $desc = ''
  $repo = $repos[$b.embed_url]
  if($repo -and $repo.description){ $desc = $repo.description }
  if([string]::IsNullOrWhiteSpace($desc)){ $desc = "Play ${($b.title_en)} online." }
  if(-not $game.description){ $game | Add-Member -NotePropertyName description -NotePropertyValue (@{ en = $desc }) -Force } else { if(-not $game.description.en){ $game.description.en = $desc } }
  $thumb = Get-OgImage $b.embed_url
  if($thumb){ $game.thumbnail = $thumb }
  $cnt++
}
$games | ConvertTo-Json -Depth 8 | Set-Content -Path $gPath -Encoding UTF8
Write-Host "Enriched $cnt games with descriptions/thumbnails" -ForegroundColor Green


