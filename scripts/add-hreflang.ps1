param(
  [string]$SiteRoot = (Resolve-Path "$PSScriptRoot\..\").Path,
  [int]$TopZhCount = 100
)

$ErrorActionPreference = 'Stop'

function Ensure-Hreflang($path, $alts) {
  $html = [System.IO.File]::ReadAllText($path)
  if ($html -notmatch 'rel=\"alternate\" href=\"[^\"]*\" hreflang=') {
    $nl = [System.Environment]::NewLine
    $ins = ''
    foreach ($a in $alts) { $ins += '  <link rel="alternate" href="'+$a.href+'" hreflang="'+$a.lang+'">' + $nl }
    $rep = $ins + '</head>'
    $html = $html -replace '(?s)</head>', $rep
    [System.IO.File]::WriteAllText($path, $html, [Text.UTF8Encoding]::new($false))
  }
}

# index
$enIndex = Join-Path $SiteRoot 'index.html'
if (Test-Path $enIndex) {
  $alts = @(
    @{ href = 'https://funnygame.help/'; lang='en' },
    @{ href = 'https://funnygame.help/zh/'; lang='zh-CN' },
    @{ href = 'https://funnygame.help/'; lang='x-default' }
  )
  Ensure-Hreflang -path $enIndex -alts $alts
}

# categories
$catDir = Join-Path $SiteRoot 'categories'
Get-ChildItem $catDir -Filter *.html -File | ForEach-Object {
  $name = $_.Name
  $alts = @(
    @{ href = 'https://funnygame.help/categories/'+$name; lang='en' },
    @{ href = 'https://funnygame.help/zh/categories/'+$name; lang='zh-CN' },
    @{ href = 'https://funnygame.help/categories/'+$name; lang='x-default' }
  )
  Ensure-Hreflang -path $_.FullName -alts $alts
}

# Top games (English pages)
$gamesPath = Join-Path $SiteRoot 'assets\data\games.json'
$json = Get-Content -Raw -LiteralPath $gamesPath | ConvertFrom-Json
$top = @($json | Sort-Object -Property @{Expression='playCount';Descending=$true} | Select-Object -First $TopZhCount)
$gamesDir = Join-Path $SiteRoot 'games'
foreach($g in $top){
  $slug = $g.id
  $path = Join-Path $gamesDir ("$slug.html")
  if (Test-Path $path) {
    $alts = @(
      @{ href = 'https://funnygame.help/games/'+$slug+'.html'; lang='en' },
      @{ href = 'https://funnygame.help/zh/games/'+$slug+'.html'; lang='zh-CN' },
      @{ href = 'https://funnygame.help/games/'+$slug+'.html'; lang='x-default' }
    )
    Ensure-Hreflang -path $path -alts $alts
  }
}

Write-Host 'Hreflang added (index, categories, top games).'


