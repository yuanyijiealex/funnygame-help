param(
  [int]$Max = 100000,
  [int]$Timeout = 12,
  [string]$OutCsv = ''
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$swTotal = [System.Diagnostics.Stopwatch]::StartNew()
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$gamesJson = Join-Path $root 'assets/data/games.json'
$games = Get-Content -Raw -Path $gamesJson | ConvertFrom-Json
$games = $games | Select-Object -First $Max

function Test-FramePolicy($headers){
  $xfo = ''
  $csp = ''
  if($headers['X-Frame-Options']){ $xfo = [string]$headers['X-Frame-Options'] }
  if($headers['Content-Security-Policy']){ $csp = [string]$headers['Content-Security-Policy'] }
  $blocked = $false
  if($xfo){ $xf=$xfo.ToLower(); if($xf -match 'deny' -or $xf -match 'sameorigin'){ $blocked=$true } }
  if(-not $blocked -and $csp){ $cs=$csp.ToLower(); if($cs -match 'frame-ancestors'){ if($cs -match "frame-ancestors\s+'none'" -or $cs -match 'frame-ancestors\s+self' -or ($cs -notmatch 'frame-ancestors[^;]*https:' -and $cs -notmatch 'frame-ancestors[^;]*\*')){ $blocked=$true } } }
  return @{ blocked = $blocked; xfo=$xfo; csp=$csp }
}

$rows = @()
$i=0
foreach($g in $games){
  $i++
  $id = $g.id
  $url = $g.embedUrl
  $status = ''
  $elapsed = ''
  $finalUrl = ''
  $headers = $null
  $ok = $false
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Head -TimeoutSec $Timeout -MaximumRedirection 5 -ErrorAction Stop
    $status = $resp.StatusCode
    $headers = $resp.Headers
    $finalUrl = ($resp.BaseResponse).ResponseUri.AbsoluteUri
    $ok = $true
  } catch {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Get -TimeoutSec ($Timeout+5) -MaximumRedirection 5 -ErrorAction Stop
      $status = $resp.StatusCode
      $headers = $resp.Headers
      $finalUrl = ($resp.BaseResponse).ResponseUri.AbsoluteUri
      $ok = $true
    } catch {
      $status = 'ERR'
      $finalUrl = ''
    }
  }
  $sw.Stop(); $elapsed = [math]::Round($sw.Elapsed.TotalSeconds,2)
  $fp = if($ok){ Test-FramePolicy $headers } else { @{ blocked=$null; xfo=''; csp='' } }
  $imgPath = Join-Path $root ($g.thumbnail.TrimStart('/').Replace('/','\'))
  $imgLocal = Test-Path $imgPath
  $rows += [pscustomobject]@{
    id=$id; status=$status; time_s=$elapsed; final=$finalUrl; frame_blocked=$fp.blocked; x_frame_options=$fp.xfo; csp=$fp.csp; img_local=$imgLocal
  }
}
if([string]::IsNullOrWhiteSpace($OutCsv)){
  $date = Get-Date -Format 'yyyyMMdd-HHmm'
  $OutCsv = Join-Path $root ("temp/qa-full-audit-"+$date+".csv")
}
$rows | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
$swTotal.Stop()
Write-Host ("AUDIT DONE in {0}s for {1} games -> {2}" -f [math]::Round($swTotal.Elapsed.TotalSeconds,1), $games.Count, $OutCsv) -ForegroundColor Green
