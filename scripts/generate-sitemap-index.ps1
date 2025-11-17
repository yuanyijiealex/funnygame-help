param(
  [string]$SiteRoot = (Resolve-Path "$PSScriptRoot\..\").Path,
  [string]$BaseUrl  = 'https://funnygame.help',
  [int]$ChunkSize   = 500
)

$ErrorActionPreference = 'Stop'

function New-SitemapXml([string[]]$paths, [string]$outFile, [string]$baseUrl){
  [xml]$xml = New-Object System.Xml.XmlDocument
  $urlset = $xml.CreateElement('urlset')
  $ns = $xml.CreateAttribute('xmlns'); $ns.Value = 'http://www.sitemaps.org/schemas/sitemap/0.9'; $null = $urlset.Attributes.Append($ns)
  foreach($rel in $paths){
    $url = $xml.CreateElement('url')
    $locEl = $xml.CreateElement('loc'); $locEl.InnerText = ("$baseUrl/" + ($rel -replace '\\','/')); $null=$url.AppendChild($locEl)
    $lmEl  = $xml.CreateElement('lastmod'); $lmEl.InnerText = (Get-Date (Get-Item (Join-Path $SiteRoot $rel)).LastWriteTimeUtc -Format 'yyyy-MM-ddTHH:mm:ssZ'); $null=$url.AppendChild($lmEl)
    $cfEl  = $xml.CreateElement('changefreq'); $cfEl.InnerText = 'weekly'; $null=$url.AppendChild($cfEl)
    $null=$urlset.AppendChild($url)
  }
  $null=$xml.AppendChild($urlset)
  $xml.Save((Join-Path $SiteRoot $outFile))
}

function Write-Index([string[]]$sitemaps, [string]$indexFile){
  [xml]$xml = New-Object System.Xml.XmlDocument
  $idx = $xml.CreateElement('sitemapindex')
  $ns = $xml.CreateAttribute('xmlns'); $ns.Value = 'http://www.sitemaps.org/schemas/sitemap/0.9'; $null = $idx.Attributes.Append($ns)
  foreach($sm in $sitemaps){
    $smNode = $xml.CreateElement('sitemap')
    $loc = $xml.CreateElement('loc'); $loc.InnerText = "$BaseUrl/$sm"; $null=$smNode.AppendChild($loc)
    $lm  = $xml.CreateElement('lastmod'); $lm.InnerText = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ'); $null=$smNode.AppendChild($lm)
    $null=$idx.AppendChild($smNode)
  }
  $null=$xml.AppendChild($idx)
  $xml.Save((Join-Path $SiteRoot $indexFile))
}

# Collect files
$all = Get-ChildItem -Path $SiteRoot -Recurse -File -Include *.html |
  Where-Object { $_.FullName -notmatch '\\(temp|sources|tools|docs|\.git|\.github|assets\\games-content)\\' }

$rel = $all | ForEach-Object { $_.FullName.Substring($SiteRoot.Length).TrimStart([IO.Path]::DirectorySeparatorChar) }

$rootFiles = $rel | Where-Object { $_ -notlike 'games/*' -and $_ -notlike 'categories/*' -and $_ -notlike 'zh/*' }
$catFiles  = $rel | Where-Object { $_ -like 'categories/*' }
$gameFiles = $rel | Where-Object { $_ -like 'games/*' }
$zhFiles   = $rel | Where-Object { $_ -like 'zh/*' }

$sitemaps = @()
if($rootFiles.Count){ New-SitemapXml -paths $rootFiles -outFile 'sitemap-root.xml' -baseUrl $BaseUrl; $sitemaps += 'sitemap-root.xml' }
if($catFiles.Count){ New-SitemapXml -paths $catFiles -outFile 'sitemap-categories.xml' -baseUrl $BaseUrl; $sitemaps += 'sitemap-categories.xml' }

# chunk games
if($gameFiles.Count){
  for($i=0; $i -lt $gameFiles.Count; $i+=$ChunkSize){
    $chunk = $gameFiles[$i..([Math]::Min($i+$ChunkSize-1,$gameFiles.Count-1))]
    $name = 'sitemap-games-' + ([int]([math]::Floor($i/$ChunkSize))+1) + '.xml'
    New-SitemapXml -paths $chunk -outFile $name -baseUrl $BaseUrl
    $sitemaps += $name
  }
}
# chunk zh
if($zhFiles.Count){
  for($i=0; $i -lt $zhFiles.Count; $i+=$ChunkSize){
    $chunk = $zhFiles[$i..([Math]::Min($i+$ChunkSize-1,$zhFiles.Count-1))]
    $name = 'sitemap-zh-' + ([int]([math]::Floor($i/$ChunkSize))+1) + '.xml'
    New-SitemapXml -paths $chunk -outFile $name -baseUrl $BaseUrl
    $sitemaps += $name
  }
}

Write-Index -sitemaps $sitemaps -indexFile 'sitemap-index.xml'

# Update robots.txt to include index
$robots = Join-Path $SiteRoot 'robots.txt'
$content = Get-Content -Raw -LiteralPath $robots
if($content -notmatch 'sitemap-index.xml'){
  Add-Content -Encoding UTF8 -LiteralPath $robots "Sitemap: $BaseUrl/sitemap-index.xml"
}

Write-Host "Generated sitemaps:"; $sitemaps | ForEach-Object { Write-Host " - $_" }
