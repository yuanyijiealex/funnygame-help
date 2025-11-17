param(
  [string]$SiteRoot = (Resolve-Path "$PSScriptRoot\..\").Path,
  [string]$Lang = 'en',
  [int]$TopZhCount = 100
)

$ErrorActionPreference = 'Stop'
$gamesPath = Join-Path $SiteRoot 'assets\data\games.json'
if (!(Test-Path $gamesPath)) { throw "games.json not found at $gamesPath" }
$json = Get-Content -Raw -LiteralPath $gamesPath | ConvertFrom-Json

function TitleOf($g, $lang){
  if ($g.title -is [string]) { return $g.title }
  if ($g.title.$lang) { return $g.title.$lang }
  if ($g.title.'zh-CN') { return $g.title.'zh-CN' }
  if ($g.title.en) { return $g.title.en }
  return $g.id
}
function DescOf($g, $lang){
  $t = $g.longDescription
  if (-not $t) { $t = $g.description }
  if ($t -is [string]) { return $t }
  if ($t.$lang) { return $t.$lang }
  if ($t.'zh-CN') { return $t.'zh-CN' }
  if ($t.en) { return $t.en }
  return ''
}

# Inject static description + related for EN pages
$gamesDir = Join-Path $SiteRoot 'games'
Get-ChildItem $gamesDir -Filter *.html -File | ForEach-Object {
  $file = $_.FullName
  $slug = [IO.Path]::GetFileNameWithoutExtension($_.Name)
  $g = $json | Where-Object { $_.id -eq $slug }
  if (-not $g) { return }
  $html = [System.IO.File]::ReadAllText($file)
  $desc = DescOf $g 'en'
  if (-not [string]::IsNullOrWhiteSpace($desc)) {
    $descHtml = [System.Web.HttpUtility]::HtmlEncode($desc)
    $nl = [System.Environment]::NewLine
    $block = $nl + '<!-- AUTO:DESCRIPTION START -->' + $nl + '<section class="game-description" style="margin:16px 0"><p>' + $nl + $descHtml + $nl + '</p></section>' + $nl + '<!-- AUTO:DESCRIPTION END -->' + $nl
    if ($html -match '<!-- AUTO:DESCRIPTION START -->.*<!-- AUTO:DESCRIPTION END -->') {
      $html = [regex]::Replace($html,'(?s)<!-- AUTO:DESCRIPTION START -->.*?<!-- AUTO:DESCRIPTION END -->',$block)
    } else {
      $rep = $block + '</main>'
      $html = $html -replace '(?s)</main>', $rep
    }
  }
  # Related games by categories
  $cats = @()
  if ($g.categories -and $g.categories.Count -gt 0) { $cats = @($g.categories) } 
  $pool = @($json | Where-Object { $_.id -ne $g.id -and $_.hidden -ne $true -and (($_.categories) -and ($_.categories | Where-Object { $cats -contains $_ }).Count -gt 0) })
  $top = @($pool | Sort-Object -Property @{Expression='playCount';Descending=$true} | Select-Object -First 8)
  if ($top.Count -gt 0) {
    $cards = ''
    foreach($x in $top){
      $tid = $x.id
      $tt = TitleOf $x 'en'
      $local = "/assets/images/games/$tid.jpg"
      $th = if ($x.thumbnail) { $x.thumbnail } else { $local }
      $cards += '<a class="game-card" href="/games/' + $tid + '.html"><img class="game-image" loading="lazy" src="' + $th + '" alt="' + $tt + '" onerror="this.onerror=null; this.src=' + "'" + $local + "'" + ';"><div class="game-info"><div class="game-title">' + $tt + '</div></div></a>'
    }
    $rblock = $nl + '<!-- AUTO:RELATED START -->' + $nl + '<section class="container" style="margin:24px auto"><h2 style="margin-bottom:12px">Related Games</h2><div id="related-games" class="games-grid">' + $nl + $cards + $nl + '</div></section>' + $nl + '<!-- AUTO:RELATED END -->' + $nl
    if ($html -match '<!-- AUTO:RELATED START -->.*<!-- AUTO:RELATED END -->') {
      $html = [regex]::Replace($html,'(?s)<!-- AUTO:RELATED START -->.*?<!-- AUTO:RELATED END -->',$rblock)
    } else {
      $rep2 = $rblock + '</main>'
      $html = $html -replace '(?s)</main>', $rep2
    }
  }
  # Remove client runtime helper if present
  $html = $html -replace '(?m)^\s*<script src="/assets/js/game-page.js"></script>\s*',''
  [System.IO.File]::WriteAllText($file, $html, [Text.UTF8Encoding]::new($false))
}

# Generate zh pages (top N)
$zhRoot = Join-Path $SiteRoot 'zh'
New-Item -Force -ItemType Directory -Path (Join-Path $zhRoot 'games') | Out-Null
New-Item -Force -ItemType Directory -Path (Join-Path $zhRoot 'categories') | Out-Null

$topZh = @($json | Sort-Object -Property @{Expression='playCount';Descending=$true} | Select-Object -First $TopZhCount)
foreach($g in $topZh){
  $slug = $g.id
  $srcFile = Join-Path $gamesDir ("$slug.html")
  if (!(Test-Path $srcFile)) { continue }
  $html = [System.IO.File]::ReadAllText($srcFile)
  # lang attr
  $html = [regex]::Replace($html,'<html[^>]*lang="[^"]*"','<html lang="zh-CN"')
  # title and meta
  $tzh = TitleOf $g 'zh-CN'
  $dzh = DescOf $g 'zh-CN'
  if ($tzh) { $html = [regex]::Replace($html,'<title>.*?</title>','<title>'+[System.Web.HttpUtility]::HtmlEncode($tzh)+' - funnygame.help</title>') }
  if ($dzh) { $html = [regex]::Replace($html,'<meta name="description" content="[^"]*"\s*/?>','<meta name="description" content="'+[System.Web.HttpUtility]::HtmlEncode($dzh)+'">') }
  # canonical to zh URL + hreflang back
  $enUrl = "https://funnygame.help/games/$slug.html"
  $zhUrl = "https://funnygame.help/zh/games/$slug.html"
  if ($html -match '<link rel=\"canonical\"') {
    $html = [regex]::Replace($html,'<link rel=\"canonical\" href=\"[^\"]*\"','<link rel="canonical" href="'+$zhUrl+'"')
  } else {
    $nl = [System.Environment]::NewLine
    $repCan = '$1' + $nl + '  <link rel="canonical" href="' + $zhUrl + '">' + $nl
    $html = [regex]::Replace($html,'(?s)(<meta[^>]*property=\"og:type\"[^>]*>\s*)',$repCan)
  }
  # hreflang
  if ($html -notmatch 'rel=\"alternate\" href=\"[^\"]*\" hreflang=') {
    $nl = [System.Environment]::NewLine
    $inserts = '  <link rel="alternate" href="' + $enUrl + '" hreflang="en">' + $nl + '  <link rel="alternate" href="' + $zhUrl + '" hreflang="zh-CN">' + $nl + '  <link rel="alternate" href="' + $enUrl + '" hreflang="x-default">' + $nl
    $rep3 = $inserts + '</head>'
    $html = $html -replace '(?s)</head>', $rep3
  }
  # description injection
  $desc = DescOf $g 'zh-CN'
  if (-not [string]::IsNullOrWhiteSpace($desc)) {
    $descHtml = [System.Web.HttpUtility]::HtmlEncode($desc)
    $nl = [System.Environment]::NewLine
    $block = $nl + '<!-- AUTO:DESCRIPTION START -->' + $nl + '<section class="game-description" style="margin:16px 0"><p>' + $nl + $descHtml + $nl + '</p></section>' + $nl + '<!-- AUTO:DESCRIPTION END -->' + $nl
    if ($html -match '<!-- AUTO:DESCRIPTION START -->.*<!-- AUTO:DESCRIPTION END -->') {
      $html = [regex]::Replace($html,'(?s)<!-- AUTO:DESCRIPTION START -->.*?<!-- AUTO:DESCRIPTION END -->',$block)
    } else {
      $rep4 = $block + '</main>'
      $html = $html -replace '(?s)</main>', $rep4
    }
  }
  # related (same as EN but keep EN titles if zh missing)
  $cats = @()
  if ($g.categories -and $g.categories.Count -gt 0) { $cats = @($g.categories) }
  $pool = @($json | Where-Object { $_.id -ne $g.id -and $_.hidden -ne $true -and (($_.categories) -and ($_.categories | Where-Object { $cats -contains $_ }).Count -gt 0) })
  $top = @($pool | Sort-Object -Property @{Expression='playCount';Descending=$true} | Select-Object -First 8)
  if ($top.Count -gt 0) {
    $cards = ''
    foreach($x in $top){
      $tid = $x.id
      $tt = TitleOf $x 'zh-CN'
      if (-not $tt) { $tt = TitleOf $x 'en' }
      $local = "/assets/images/games/$tid.jpg"
      $th = if ($x.thumbnail) { $x.thumbnail } else { $local }
      $cards += '<a class="game-card" href="/zh/games/' + $tid + '.html"><img class="game-image" loading="lazy" src="' + $th + '" alt="' + $tt + '" onerror="this.onerror=null; this.src=' + "'" + $local + "'" + ';"><div class="game-info"><div class="game-title">' + $tt + '</div></div></a>'
    }
    $rblock = $nl + '<!-- AUTO:RELATED START -->' + $nl + '<section class="container" style="margin:24px auto"><h2 style="margin-bottom:12px">相关游戏</h2><div id="related-games" class="games-grid">' + $nl + $cards + $nl + '</div></section>' + $nl + '<!-- AUTO:RELATED END -->' + $nl
    if ($html -match '<!-- AUTO:RELATED START -->.*<!-- AUTO:RELATED END -->') {
      $html = [regex]::Replace($html,'(?s)<!-- AUTO:RELATED START -->.*?<!-- AUTO:RELATED END -->',$rblock)
    } else {
      $rep5 = $rblock + '</main>'
      $html = $html -replace '(?s)</main>', $rep5
    }
  }
  $dst = Join-Path $zhRoot ("games\$slug.html")
  [System.IO.File]::WriteAllText($dst, $html, [Text.UTF8Encoding]::new($false))
}

# zh index and categories
$enIndex = Join-Path $SiteRoot 'index.html'
if (Test-Path $enIndex) {
  $html = [System.IO.File]::ReadAllText($enIndex)
  $html = [regex]::Replace($html,'<html[^>]*lang="[^"]*"','<html lang="zh-CN"')
  $html = $html -replace 'All Games','全部游戏'
  $html = [regex]::Replace($html,'<title>.*?</title>','<title>全部游戏 - funnygame.help</title>')
  $html = [regex]::Replace($html,'<meta name="description" content="[^"]*"\s*/?>','<meta name="description" content="在 funnygame.help 畅玩免费HTML5在线游戏，无需下载，立即开始。">')
  $html = [regex]::Replace($html,'<link rel="canonical" href="[^"]*"','<link rel="canonical" href="https://funnygame.help/zh/"')
  $dst = Join-Path $zhRoot 'index.html'
  [System.IO.File]::WriteAllText($dst, $html, [Text.UTF8Encoding]::new($false))
}

$catMap = @{ 'action'='动作游戏'; 'casual'='休闲游戏'; 'platformer'='平台跳跃'; 'puzzle'='益智游戏'; 'racing'='赛车游戏'; 'rpg'='角色扮演'; 'shooting'='射击游戏'; 'strategy'='策略游戏' }
$catDir = Join-Path $SiteRoot 'categories'
Get-ChildItem $catDir -Filter *.html -File | ForEach-Object {
  $name = [IO.Path]::GetFileNameWithoutExtension($_.Name)
  $titleZh = $catMap[$name]
  if (-not $titleZh) { $titleZh = $name }
  $html = [System.IO.File]::ReadAllText($_.FullName)
  $html = [regex]::Replace($html,'<html[^>]*lang="[^"]*"','<html lang="zh-CN"')
  $html = [regex]::Replace($html,'<title>.*?</title>','<title>'+[System.Web.HttpUtility]::HtmlEncode($titleZh)+' - funnygame.help</title>')
  $html = [regex]::Replace($html,'<meta name="description" content="[^"]*"\s*/?>','<meta name="description" content="在 funnygame.help 浏览'+[System.Web.HttpUtility]::HtmlEncode($titleZh)+' 分类的免费HTML5在线游戏。">')
  $html = [regex]::Replace($html,'<meta property="og:title" content="[^"]*"','<meta property="og:title" content="'+[System.Web.HttpUtility]::HtmlEncode($titleZh)+' - funnygame.help"')
  $html = [regex]::Replace($html,'<meta property="og:description" content="[^"]*"','<meta property="og:description" content="在 funnygame.help 浏览'+[System.Web.HttpUtility]::HtmlEncode($titleZh)+' 分类的免费HTML5在线游戏。"')
  $html = [regex]::Replace($html,'<meta property="og:url" content="[^"]*"','<meta property="og:url" content="https://funnygame.help/zh/categories/'+$_.Name+'"')
  $html = [regex]::Replace($html,'<link rel="canonical" href="[^"]*"','<link rel="canonical" href="https://funnygame.help/zh/categories/'+$_.Name+'"')
  $dst = Join-Path $zhRoot ('categories\'+$_.Name)
  [System.IO.File]::WriteAllText($dst, $html, [Text.UTF8Encoding]::new($false))
}

Write-Host 'Build completed: EN injected, ZH generated.'
