param(
  [ValidateSet("playcount","newest")]
  [string]$KeepStrategy = 'playcount',
  [switch]$WriteRedirects,
  [switch]$Force,
  [switch]$DryRun,
  [string[]]$Stopwords = @('msdos','ibm','pc','dos','the')
)
$ErrorActionPreference = 'Stop'
function Write-Info($m){ Write-Host "[info] $m" -ForegroundColor Cyan }
function Write-Warn($m){ Write-Host "[warn] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[err ] $m" -ForegroundColor Red }
$repoRoot = (Get-Location).Path
$jsonPath = Join-Path $repoRoot 'assets/data/games.json'
$gamesDir = Join-Path $repoRoot 'games'
if(!(Test-Path -LiteralPath $jsonPath)) { Write-Err "Not found: $jsonPath"; exit 1 }
function Normalize-Title([string]$t){ if([string]::IsNullOrWhiteSpace($t)){ return '' }; $x = $t.ToLowerInvariant(); $x = [Regex]::Replace($x, "[\(\[][\s\S]*?[\)\]]", ''); $x = $x -replace '[-_]+',' '; foreach($w in $Stopwords){ if($w){ $x = [Regex]::Replace($x, "\b"+[Regex]::Escape($w.ToLowerInvariant())+"\b", '') } }; $x = [Regex]::Replace($x, "\b(19|20)\d{2}\b", ''); $x = [Regex]::Replace($x, "\s+", ' '); $x = $x.Trim(); return $x }
function Get-Title($g){ $t = $null; if($g.title -is [string]){ $t = $g.title } elseif($g.title){ if($g.title.'en'){ $t = $g.title.'en' } else { foreach($v in $g.title.PSObject.Properties.Value){ if($v){ $t=$v; break } } } }; if(-not $t){ $t = $g.id }; return [string]$t }
function Parse-Date($s){ try { [DateTime]::Parse($s) } catch { [DateTime]::MinValue } }
$list = Get-Content -LiteralPath $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json -Depth 60
if(-not ($list -is [System.Collections.IEnumerable])){ Write-Err 'games.json is not an array'; exit 1 }
$groups = @{}
foreach($g in $list){ $key = Normalize-Title (Get-Title $g); if([string]::IsNullOrWhiteSpace($key)){ $key = $g.id.ToLower() }; if(-not $groups.ContainsKey($key)){ $groups[$key]=@() }; $groups[$key]+=$g }
$actions = @()
foreach($kv in $groups.GetEnumerator()){
  $items = @($kv.Value); if($items.Count -le 1){ continue }
  $keep = $null
  if($KeepStrategy -eq 'playcount'){
    $keep = $items | Sort-Object @{Expression={ [int]($_.playCount) }; Descending=$true}, @{Expression={ Parse-Date $_.addedDate }; Descending=$true} | Select-Object -First 1
  } else {
    $keep = $items | Sort-Object @{Expression={ Parse-Date $_.addedDate }; Descending=$true}, @{Expression={ [int]($_.playCount) }; Descending=$true} | Select-Object -First 1
  }
  $dupes = $items | Where-Object { $_ -ne $keep }
  $keepId = $keep.id
  foreach($d in $dupes){
    $did = $d.id; $changed = $false
    if(-not $d.PSObject.Properties.Match('hidden')){ $d | Add-Member -NotePropertyName hidden -NotePropertyValue $true; $changed=$true } elseif(-not $d.hidden){ $d.hidden=$true; $changed=$true }
    $target = "/games/$keepId.html"
    if(-not $d.PSObject.Properties.Match('redirectTo')){ $d | Add-Member -NotePropertyName redirectTo -NotePropertyValue $target; $changed=$true } elseif($d.redirectTo -ne $target){ $d.redirectTo=$target; $changed=$true }
    if($WriteRedirects){ $dst = Join-Path $gamesDir ("$did.html"); if($Force -or -not (Test-Path -LiteralPath $dst)){
      $html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=' + $target + '"><title>Redirecting...</title><link rel="canonical" href="' + $target + '"/><meta name="robots" content="noindex,follow"/></head><body><p>If you are not redirected, <a href="' + $target + '">click here</a>.</p><script>location.replace(''' + $target + ''');</script></body></html>';
      Set-Content -LiteralPath $dst -Value $html -Encoding UTF8 } }
    $actions += [PSCustomObject]@{ Group=$kv.Key; Keep=$keepId; Hide=$did; Changed=$changed }
  }
}
if($DryRun){ Write-Host 'Dry-Run summary:' -ForegroundColor Green; $actions | Sort-Object Group,Hide | ForEach-Object { "- [$($_.Group)] keep=$($_.Keep) hide=$($_.Hide) changed=$($_.Changed)" } | ForEach-Object { $_ }; exit 0 }
($list | ConvertTo-Json -Depth 60) | Set-Content -LiteralPath $jsonPath -Encoding UTF8
Write-Info ("Groups processed: {0}, Duplicates: {1}" -f ($groups.Count), ($actions.Count))
