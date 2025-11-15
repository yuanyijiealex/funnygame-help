param(
  [switch]$DryRun,
  [int]$TimeoutSec = 12,
  [int]$Max = 0
)

$ErrorActionPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Test-Embed($url, $Timeout) {
  try {
    $resp = iwr -UseBasicParsing -TimeoutSec $Timeout -Uri $url -Method Head -ErrorAction Stop
    return $true
  } catch {
    try { $resp = iwr -UseBasicParsing -TimeoutSec ($Timeout+5) -Uri $url -Method Get -ErrorAction Stop; return $true } catch { return $false }
  }
}
function Build-Slugs($title){
  $year=$null
  if($title -match '\\((\\d{4})\\)'){ $year=$Matches[1]; $title=$title -replace '\\s*\\(\\d{4}\\)\\s*','' }
  $t = $title.ToLower() -replace '[^a-z0-9\\s-]','' -replace '\\s+','-'
  $t = $t.Trim('-')
  $slugs = New-Object System.Collections.Generic.List[string]
  if($t){ $slugs.Add($t) }
  if($year){ $slugs.Add("$t-$year") }
  if($t.StartsWith('the-')){ $n=$t.Substring(4); if($n){ $slugs.Add($n); if($year){ $slugs.Add("$n-$year") } } }
  foreach($s in @($slugs.ToArray())){ foreach($a in @('dos','ms-dos')){ $slugs.Add("$s-$a") } }
  $slugs | Select-Object -Unique
}
function Find-Mirrors($id, $title){
  $cands = New-Object System.Collections.Generic.List[string]
  $isDOS = $id -match '^msdos_' -or ($id+" "+$title) -match '(doom|wolf|duke|lotus|oregon|stunts|simcity|pac|aladdin|dune|jazz|prehistorik|scorched|donkey|munchers)'
  if($isDOS){
    $slugs = Build-Slugs $title
    foreach($s in $slugs){
      $cands.Add("https://www.retrogames.cc/embed/pc-games/$s.html")
      $cands.Add("https://playclassic.games/game/$s/play/")
    }
  }
  $cands | Select-Object -Unique
}

$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$dataPath = Join-Path $root 'assets/data/games.json'
$json = Get-Content -Raw -LiteralPath $dataPath -Encoding UTF8
$games = $json | ConvertFrom-Json
if(-not ($games -is [System.Collections.IEnumerable])){ $games = @($games) }

$report = @()
$count = 0
foreach($g in $games){
  if($Max -gt 0 -and $count -ge $Max){ break }
  $count++
  $title = if($g.title -is [string]){ $g.title } elseif($g.title.en){ $g.title.en } else { ($g.title | Get-Member -MemberType NoteProperty | Select-Object -First 1).Name }
  $ok = Test-Embed $g.embedUrl $TimeoutSec
  if(-not $ok){
    $mirrors = Find-Mirrors $g.id $title
    foreach($m in $mirrors){ if(Test-Embed $m $TimeoutSec){ $g.embedUrl=$m; $ok=$true; break } }
  }
  if(-not $ok){
    if(-not $g.PSObject.Properties['hidden']){ $g | Add-Member -NotePropertyName hidden -NotePropertyValue $true } else { $g.hidden = $true }
    $report += [pscustomobject]@{ id=$g.id; title=$title; action='hidden'; note='all mirrors failed' }
  } else {
    if($g.PSObject.Properties['hidden']){ $g.hidden = $false }
    $report += [pscustomobject]@{ id=$g.id; title=$title; action='ok'; note=$g.embedUrl }
  }
}

if($DryRun){
  $report | Format-Table -AutoSize
} else {
  $games | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $dataPath -Encoding UTF8
  if(-not (Test-Path (Join-Path $root 'temp'))){ New-Item -ItemType Directory -Force -Path (Join-Path $root 'temp') | Out-Null }
  $outCsv = Join-Path $root 'temp/auto-hide-report.csv'
  $report | Export-Csv -NoTypeInformation -Path $outCsv -Encoding UTF8
  Write-Host "UPDATED games.json; report: $outCsv"
}
