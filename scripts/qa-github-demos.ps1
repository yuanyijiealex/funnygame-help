param(
  [string]$InCsv = (Join-Path (Split-Path -Parent $PSCommandPath | Split-Path -Parent) 'sources/github-games-*.csv' | Get-ChildItem | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName),
  [int]$Count = 100,
  [string]$OutCsv = ''
)
$ErrorActionPreference = 'Stop'
if(-not $InCsv){ throw 'No github-games CSV found under sources/' }
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$sourcesDir = Join-Path $root 'sources'
if([string]::IsNullOrWhiteSpace($OutCsv)){
  $date = Get-Date -Format 'yyyyMMdd'
  $OutCsv = Join-Path $sourcesDir ("github-games-checked-" + $date + ".csv")
}
$rows = Import-Csv -Path $InCsv | Select-Object -First $Count
$checked = @()
foreach($r in $rows){
  $url = $r.candidate_demo
  $status = ''
  try { $resp = iwr -UseBasicParsing -Uri $url -Method Head -TimeoutSec 12 -ErrorAction Stop; $status = $resp.StatusCode }
  catch { try { $resp = iwr -UseBasicParsing -Uri $url -Method Get -TimeoutSec 18 -ErrorAction Stop; $status = $resp.StatusCode } catch { $status = 'ERR' } }
  $checked += [pscustomobject]@{ full_name=$r.full_name; html_url=$r.html_url; candidate_demo=$url; demo_status=$status; stars=$r.stars; license=$r.license; topics=$r.topics }
  Start-Sleep -Milliseconds 200
}
$checked | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "Saved: $OutCsv ($($checked.Count) repos)" -ForegroundColor Green
