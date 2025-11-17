param(
  [string]$SiteRoot = (Resolve-Path "$PSScriptRoot\..\").Path,
  [string]$BaseUrl = "https://funnygame.help"
)

$ErrorActionPreference = 'Stop'

# Normalize absolute root with trailing path separator
$root = (Resolve-Path $SiteRoot).Path
if (-not $root.EndsWith([IO.Path]::DirectorySeparatorChar)) { $root += [IO.Path]::DirectorySeparatorChar }

# Only index site pages; exclude tooling/temp and embedded vendor content
$files = Get-ChildItem -Path $root -Recurse -File -Include *.html |
  Where-Object { $_.FullName -notmatch '\\(temp|sources|tools|docs|\.git|\.github|assets\\games-content)\\' }

$urls = @()
foreach($f in $files){
  $full = $f.FullName
  $rel = if ($full.StartsWith($root)) { $full.Substring($root.Length) } else { $f.Name }
  $rel = $rel -replace '\\','/'
  $loc = if($rel -ieq 'index.html'){ "$BaseUrl/" } else { "$BaseUrl/$rel" }
  $lastmod = (Get-Date $f.LastWriteTimeUtc -Format 'yyyy-MM-ddTHH:mm:ssZ')
  $priority = if($rel -ieq 'index.html'){ '1.0' } elseif($rel -like 'categories/*'){ '0.7' } elseif($rel -like 'games/*'){ '0.6' } elseif($rel -like 'zh/*'){ '0.6' } else { '0.5' }
  $urls += [pscustomobject]@{ loc=$loc; lastmod=$lastmod; changefreq='weekly'; priority=$priority }
}

[xml]$xml = New-Object System.Xml.XmlDocument
$urlset = $xml.CreateElement('urlset')
$nsAttr = $xml.CreateAttribute('xmlns'); $nsAttr.Value = 'http://www.sitemaps.org/schemas/sitemap/0.9'; $urlset.Attributes.Append($nsAttr) | Out-Null
foreach($u in $urls){
  $url = $xml.CreateElement('url')
  foreach($k in 'loc','lastmod','changefreq','priority'){
    $n = $xml.CreateElement($k); $n.InnerText = $u.$k; $url.AppendChild($n) | Out-Null
  }
  $urlset.AppendChild($url) | Out-Null
}
$xml.AppendChild($urlset) | Out-Null
$outPath = Join-Path $root 'sitemap.xml'
$xml.Save($outPath)
Write-Host "Generated: $outPath (" $urls.Count ")"
