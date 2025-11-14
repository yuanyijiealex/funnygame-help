param(
  [Parameter(Mandatory=$true)][string]$CsvPath
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if(-not (Test-Path $CsvPath)) { throw "CSV not found: $CsvPath" }
$rows = Import-Csv -Path $CsvPath
foreach($r in $rows){
  & (Join-Path (Split-Path -Parent $PSCommandPath) 'add_game.ps1') `
    -Id $r.id `
    -TitleEn $r.title_en `
    -EmbedUrl $r.embed_url `
    -CategoriesCsv $r.categories `
    -ThumbnailUrl $r.thumbnail_url `
    -TitleZh ($r.title_zh) `
    -TitleEs ($r.title_es) `
    -TitleFr ($r.title_fr)
}

Write-Output "DONE: $($rows.Count) games processed"

