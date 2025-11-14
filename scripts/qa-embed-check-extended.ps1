param([int]$Count=30)
$root = 'D:\product\游戏站备份\funnygame-help-main'
$games = Get-Content -Raw -Path (Join-Path $root 'assets\data\games.json') | ConvertFrom-Json
$recent = $games | Select-Object -Last $Count
$result = @()
foreach($g in $recent){
  $imgPath = Join-Path $root ($g.thumbnail.TrimStart('/').Replace('/','\'))
  $okImg = Test-Path $imgPath
  $status = $null
  try { $resp = iwr -UseBasicParsing -TimeoutSec 10 -Uri $g.embedUrl -Method Head -ErrorAction Stop; $status = $resp.StatusCode }
  catch { try { $resp = iwr -UseBasicParsing -TimeoutSec 15 -Uri $g.embedUrl -Method Get -ErrorAction Stop; $status = $resp.StatusCode } catch { $status = 'ERR' } }
  $result += [pscustomobject]@{ id=$g.id; status=$status; img=$okImg }
}
$result | Where-Object { $_.status -ne 200 -or -not $_.img } | Format-Table -AutoSize
