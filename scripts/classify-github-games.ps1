param(
  [string]$InCsv,
  [string]$OutCsv
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$sourcesDir = Join-Path $root 'sources'
if(-not $InCsv){
  $InCsv = Get-ChildItem -LiteralPath $sourcesDir -Filter 'github-games-*.csv' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if(-not $OutCsv){
  $date = Get-Date -Format 'yyyyMMdd'
  $OutCsv = Join-Path $sourcesDir ("github-games-classified-" + $date + ".csv")
}
if(-not (Test-Path $InCsv)){ throw "Input CSV not found: $InCsv" }
$rows = Import-Csv -Path $InCsv

function Test-FramePolicy($headers){
  $xfo = ''
  $csp = ''
  if($headers['X-Frame-Options']){ $xfo = [string]$headers['X-Frame-Options'] }
  if($headers['Content-Security-Policy']){ $csp = [string]$headers['Content-Security-Policy'] }
  $frameBlocked = $false
  if($xfo){
    $xf = $xfo.ToLower()
    if($xf -match 'deny' -or $xf -match 'sameorigin'){ $frameBlocked = $true }
  }
  if(-not $frameBlocked -and $csp){
    $cs = $csp.ToLower()
    if($cs -match 'frame-ancestors'){
      # If frame-ancestors present but doesn't include https://* or * then likely blocked
      if($cs -match "frame-ancestors\s+'none'" -or $cs -match 'frame-ancestors\s+self' -or $cs -notmatch 'frame-ancestors[^;]*https:' -and $cs -notmatch 'frame-ancestors[^;]*\*'){
        $frameBlocked = $true
      }
    }
  }
  return @{ blocked = $frameBlocked; xfo=$xfo; csp=$csp }
}

$out = @()
$i=0
foreach($r in $rows){
  $i++
  $demo = $r.candidate_demo
  if([string]::IsNullOrWhiteSpace($demo)){
    $out += [pscustomobject]@{ full_name=$r.full_name; html_url=$r.html_url; demo=$null; status='NO_DEMO'; https=$false; frame_blocked=$null; x_frame_options=''; csp=''; classification='no-demo'; stars=$r.stars; license=$r.license; topics=$r.topics }
    continue
  }
  $status = ''
  $headers = @{}
  try { $resp = iwr -UseBasicParsing -Uri $demo -Method Head -TimeoutSec 12 -ErrorAction Stop; $status=$resp.StatusCode; $headers=$resp.Headers }
  catch { try { $resp = iwr -UseBasicParsing -Uri $demo -Method Get -TimeoutSec 18 -ErrorAction Stop; $status=$resp.StatusCode; $headers=$resp.Headers } catch { $status = 'ERR' } }
  $isHttps = $false
  try { $u=[Uri]$demo; $isHttps = ($u.Scheme -eq 'https') } catch {}
  $fp = Test-FramePolicy $headers
  $blocked = $fp.blocked
  $class = if($status -eq 200 -and $isHttps -and -not $blocked) { 'direct-embed' } elseif($status -eq 200 -and -not $isHttps){ 'mixed-content-risk' } elseif($status -eq 200 -and $blocked){ 'frame-blocked' } elseif($status -eq 200){ 'unknown-embed' } else { 'unreachable' }
  $out += [pscustomobject]@{ full_name=$r.full_name; html_url=$r.html_url; demo=$demo; status=$status; https=$isHttps; frame_blocked=$blocked; x_frame_options=$fp.xfo; csp=$fp.csp; classification=$class; stars=$r.stars; license=$r.license; topics=$r.topics }
}
$out | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "Saved: $OutCsv ($($out.Count))" -ForegroundColor Green
