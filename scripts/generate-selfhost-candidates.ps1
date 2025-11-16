param(
  [int]$Top = 30,
  [string]$OutCsv
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$cls = Get-ChildItem -LiteralPath (Join-Path $root 'sources') -Filter 'github-games-classified-*.csv' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
$raw = Get-ChildItem -LiteralPath (Join-Path $root 'sources') -Filter 'github-games-*.csv' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
if(-not $cls -or -not $raw){ throw 'Missing sources CSVs' }
$all = Import-Csv -Path $cls
$meta = Import-Csv -Path $raw | Group-Object full_name -AsHashTable -AsString
$accept = @('MIT','Apache-2.0','BSD-2-Clause','BSD-3-Clause','MPL-2.0','ISC')
$cands = $all | Where-Object { $_.classification -eq 'mixed-content-risk' -and ($_.license -in $accept -or [string]::IsNullOrWhiteSpace($_.license)) }
$cands = $cands | Sort-Object {[int]$_.stars} -Descending | Select-Object -First $Top
$rows = @()
foreach($r in $cands){
  $m = $meta[$r.full_name]
  $rows += [pscustomobject]@{
    full_name = $r.full_name
    stars = $r.stars
    license = $r.license
    html_url = $m.html_url
    homepage = $m.homepage
    candidate_demo = $m.candidate_demo
    suggested_id = ($r.full_name -replace '/','-').ToLower() + '-selfhost'
  }
}
if(-not $OutCsv){ $date=Get-Date -Format 'yyyyMMdd'; $OutCsv = Join-Path $root ("sources/selfhost-candidates-"+$date+".csv") }
$rows | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "WROTE $OutCsv ($($rows.Count))" -ForegroundColor Green
