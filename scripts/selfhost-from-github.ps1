param(
  [int]$Limit = 12,
  [string]$InCsv = ''
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
if([string]::IsNullOrWhiteSpace($InCsv)){
  $InCsv = Get-ChildItem -LiteralPath (Join-Path $root '') -Filter '' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if(-not (Test-Path $InCsv)){ throw '' }
$pick = Import-Csv -Path $InCsv | Select-Object -First $Limit
$destRoot = Join-Path $root ''
New-Item -ItemType Directory -Force -Path $destRoot | Out-Null
$added = @()
foreach($r in $pick){
  $owner,$repo = $r.full_name.Split('' )
  $id = ($owner + '' + $repo).ToLower()
  $branch = ''
  $zipUrl = ''+$owner+''+$repo+''+$branch
  $tmpZip = Join-Path $env:TEMP (''+$id+'')
  try { Invoke-WebRequest -UseBasicParsing -Uri $zipUrl -OutFile $tmpZip -TimeoutSec 60 } catch { continue }
  $tmpDir = Join-Path $env:TEMP (''+$id)
  if(Test-Path $tmpDir){ Remove-Item -Recurse -Force $tmpDir }
  try { Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force } catch { continue }
  $sub = Get-ChildItem -LiteralPath $tmpDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1 -ExpandProperty FullName
  $dest = Join-Path $destRoot $id
  if(Test-Path $dest){ Remove-Item -Recurse -Force $dest }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Copy-Item -Recurse -Force -Path (Join-Path $sub '') -Destination $dest
  $entry = Get-ChildItem -Recurse -LiteralPath $dest -Filter index.html | Select-Object -First 1
  if(-not $entry){ $entry = Get-ChildItem -Recurse -LiteralPath $dest -Filter *.html | Select-Object -First 1 }
  if(-not $entry){ continue }
  $added += [pscustomobject]@{ id=($id+''); title_en=($repo -replace '',''); embed_url=((''+$id+''+$entry.FullName.Substring($dest.Length+1)).Replace('','')).Trim(); categories=''; thumbnail_url='' }
}
$outCsv = Join-Path $root ''
$added | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $outCsv
Write-Host (''+$outCsv+''+$added.Count+'') -ForegroundColor Green


