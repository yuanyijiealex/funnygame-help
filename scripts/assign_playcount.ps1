param(
  [string[]]$CsvPaths,
  [int]$Start,
  [int]$Step
)
$ErrorActionPreference = 'Stop'
if(-not $CsvPaths){ $CsvPaths = @("temp/onlinegames.csv","temp/gamemonetize-top.csv") }
if(-not $Start){ $Start = 1000000 }
if(-not $Step){ $Step = 500 }
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$gamesJsonPath = Join-Path $root "assets/data/games.json"
if(-not (Test-Path $gamesJsonPath)){ throw "games.json not found: $gamesJsonPath" }
$games = Get-Content -Raw -Path $gamesJsonPath | ConvertFrom-Json
if(-not ($games -is [System.Collections.IEnumerable])){ $games = @($games) }
# Build ranking list from CSVs (in given order)
$ids = @()
foreach($csv in $CsvPaths){
  $p = (Join-Path $root $csv)
  if(Test-Path $p){
    $rows = Import-Csv -Path $p
    foreach($r in $rows){ if($null -ne $r.id -and -not [string]::IsNullOrWhiteSpace($r.id)) { $ids += $r.id.ToString().ToLower() } }
  }
}
$ids = $ids | Select-Object -Unique
# Assign playCount descending
$rank = 0
$updated = 0
foreach($id in $ids){
  $g = $games | Where-Object { $_.id -eq $id }
  if($g){
    $val = [int]($Start - $Step*$rank)
    if(-not $g.playCount -or $g.playCount -lt $val){ $g | Add-Member -NotePropertyName playCount -NotePropertyValue $val -Force; $updated++ }
    $rank++
  }
}
# Ensure monster-survivors is max
$ms = $games | Where-Object { $_.id -eq 'monster-survivors' }
if($ms){ $ms.playCount = [math]::Max([int]$ms.playCount, ($Start + $Step)) }
# Write back
$games | ConvertTo-Json -Depth 8 | Set-Content -Path $gamesJsonPath -Encoding UTF8
Write-Host "Assigned playCount to $updated games, total=$($games.Count)" -ForegroundColor Green
