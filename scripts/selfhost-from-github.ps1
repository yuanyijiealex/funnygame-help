param(
  [int]$Limit = 12
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$cls = Get-ChildItem -LiteralPath (Join-Path $root 'sources') -Filter 'github-games-classified-*.csv' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
$gamesCsv = Get-ChildItem -LiteralPath (Join-Path $root 'sources') -Filter 'github-games-*.csv' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
$all = Import-Csv -Path $cls
$meta = Import-Csv -Path $gamesCsv | Group-Object full_name -AsHashTable -AsString
$mix = $all | Where-Object classification -eq 'mixed-content-risk'
$accept = @('MIT','Apache-2.0','BSD-2-Clause','BSD-3-Clause','MPL-2.0','ISC')
$mix = $mix | Where-Object { $_.license -in $accept -and (($_.homepage -match '^http://') -or ($_.candidate_demo -match '^http://')) }
$mix = $mix | Sort-Object {[int]$_.stars} -Descending
$pick = @()
$seen = @{}
foreach($r in $mix){ if($pick.Count -ge $Limit){ break }; if($seen[$r.full_name]){ continue }; $seen[$r.full_name] = $true; $pick += $r }
$destRoot = Join-Path $root 'assets/games-content'
New-Item -ItemType Directory -Force -Path $destRoot | Out-Null
$added = @()
foreach($r in $pick){
  $owner,$repo = $r.full_name.Split('/')
  $id = ($owner + '-' + $repo).ToLower()
  $branch = ($meta[$r.full_name].default_branch) ; if([string]::IsNullOrWhiteSpace($branch)){ $branch='master' }
  $zipUrl = "https://codeload.github.com/$owner/$repo/zip/refs/heads/$branch"
  $tmpZip = Join-Path $env:TEMP ("repo-"+$id+".zip")
  try { Invoke-WebRequest -UseBasicParsing -Uri $zipUrl -OutFile $tmpZip -TimeoutSec 60 } catch { continue }
  $tmpDir = Join-Path $env:TEMP ("unz-"+$id)
  if(Test-Path $tmpDir){ Remove-Item -Recurse -Force $tmpDir }
  try { Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force } catch { continue }
  $sub = Get-ChildItem -LiteralPath $tmpDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1 -ExpandProperty FullName
  $dest = Join-Path $destRoot $id
  if(Test-Path $dest){ Remove-Item -Recurse -Force $dest }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Copy-Item -Recurse -Force -Path (Join-Path $sub '*') -Destination $dest
  $entry = Get-ChildItem -Recurse -LiteralPath $dest -Filter index.html | Select-Object -First 1
  if(-not $entry){ $entry = Get-ChildItem -Recurse -LiteralPath $dest -Filter *.html | Select-Object -First 1 }
  if(-not $entry){ continue }
  $added += [pscustomobject]@{ id=($id+'-selfhost'); title_en=($repo -replace '[-_]',' '); embed_url=(('/assets/games-content/'+$id+'/'+$entry.FullName.Substring($dest.Length+1)).Replace('\\','/')); categories='action'; thumbnail_url='' }
}
$outCsv = Join-Path $root 'temp/github-bulk-selfhost.csv'
$added | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $outCsv
Write-Host "SELFHOST CSV: $outCsv ($($added.Count))" -ForegroundColor Green
