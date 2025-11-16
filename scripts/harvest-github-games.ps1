param(
  [string[]]$Queries = @(
    'topic:game topic:html5',
    'topic:webgl topic:game',
    '"browser game" language:JavaScript',
    '"html5 game" language:JavaScript'
  ),
  [int]$PerQuery = 100,
  [int]$MaxPages = 2,
  [string]$OutCsv = ''
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $PSCommandPath | Split-Path -Parent
$sourcesDir = Join-Path $root 'sources'
$rawDir = Join-Path $sourcesDir 'raw'
New-Item -ItemType Directory -Force -Path $sourcesDir,$rawDir | Out-Null
if([string]::IsNullOrWhiteSpace($OutCsv)){
  $date = Get-Date -Format 'yyyyMMdd'
  $OutCsv = Join-Path $sourcesDir ("github-games-" + $date + ".csv")
}
$headers = @{ 'User-Agent' = 'FunnyGameHarvester/1.0'; 'Accept' = 'application/vnd.github+json' }
if($env:GITHUB_TOKEN){ $headers['Authorization'] = "Bearer $($env:GITHUB_TOKEN)" }

$all = @{}
function Add-Repo($r){
  $full = $r.full_name
  if($all.ContainsKey($full)){ return }
  $owner,$repo = $full.Split('/')
  $pages = "https://$owner.github.io/$repo"
  $topics = ''
  try { if($r.topics){ $topics = [string]::Join(';', $r.topics) } } catch {}
  $lic = ''
  try { if($r.license){ $lic = $r.license.spdx_id } } catch {}
  $obj = [pscustomobject]@{
    full_name = $full
    html_url = $r.html_url
    homepage = $r.homepage
    candidate_demo = if([string]::IsNullOrWhiteSpace($r.homepage)) { $pages } else { $r.homepage }
    description = $r.description
    language = $r.language
    topics = $topics
    license = $lic
    stars = $r.stargazers_count
    default_branch = $r.default_branch
    pushed_at = $r.pushed_at
  }
  $all[$full] = $obj
}

$base = 'https://api.github.com/search/repositories'
foreach($q in $Queries){
  $added = 0
  for($page=1; $page -le $MaxPages; $page++){
    if($added -ge $PerQuery){ break }
    $per = [math]::Min(100, $PerQuery - $added)
    $enc = [uri]::EscapeDataString($q)
    $uri = "${base}?q=$enc&sort=stars&order=desc&per_page=$per&page=$page"
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri $uri -TimeoutSec 30
      $json = $resp.Content | ConvertFrom-Json
      $items = @($json.items)
      if(-not $items){ break }
      foreach($it in $items){ Add-Repo $it }
      $added += $items.Count
      Start-Sleep -Milliseconds 600
    } catch {
      Write-Warning "GitHub API error on query: $q page: $page - $($_.Exception.Message)"; break
    }
  }
}
$rows = $all.Values | Sort-Object -Property stars -Descending
$rows | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $OutCsv
Write-Host "Saved: $OutCsv ($($rows.Count) repos)" -ForegroundColor Green
