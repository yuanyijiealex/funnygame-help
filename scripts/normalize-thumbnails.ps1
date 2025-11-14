param([string]$JsonPath="assets/data/games.json")
$ErrorActionPreference='Stop'
if(!(Test-Path -LiteralPath $JsonPath)){ throw "File not found: $JsonPath" }
$content = Get-Content -LiteralPath $JsonPath -Raw -Encoding UTF8
$data = $content | ConvertFrom-Json -Depth 20
$changed = 0
foreach($g in $data){
  $id = $g.id
  if([string]::IsNullOrWhiteSpace($id)){ continue }
  $local = "/assets/images/games/$id.jpg"
  $thumb = $g.thumbnail
  if(-not $thumb -or $thumb.ToString().ToLower().Contains('game-placeholder')){
    $g | Add-Member -NotePropertyName thumbnail -NotePropertyValue $local -Force
    $changed++
  }
}
# Keep stable ordering: id, title, description, ..., thumbnail near original isn't guaranteed, but content is correct
$json = $data | ConvertTo-Json -Depth 20
Set-Content -LiteralPath $JsonPath -Value $json -Encoding UTF8
"UPDATED=$changed"
