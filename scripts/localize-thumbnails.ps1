param(
  [string[]] = @("temp/github-bulk.csv","temp/github-bulk-2.csv")
)
Continue = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
 = Split-Path -Parent  | Split-Path -Parent
 = Join-Path  'assets/images/games'
 = Join-Path  'assets/data/games.json'
 = Get-Content -Raw -Path  | ConvertFrom-Json
 = @()
foreach( in ){  = Join-Path  ; if(Test-Path ){  += (Import-Csv -Path  | % id) } }
 =  | Select-Object -Unique
 = 0
foreach( in ){
   =  | Where-Object id -eq 
  if(-not ){ continue }
   = .thumbnail
  if([string]::IsNullOrWhiteSpace()){ continue }
  if( -like '/assets/images/*'){ continue }
  if( -notmatch '^https?://'){ continue }
   = Join-Path  (".jpg")
  try {
    Invoke-WebRequest -UseBasicParsing -Uri  -OutFile  -TimeoutSec 25 | Out-Null
    .thumbnail = "/assets/images/games/.jpg"
    ++
  } catch {}
}
 | ConvertTo-Json -Depth 8 | Set-Content -Path  -Encoding UTF8
Write-Host "Localized  thumbnails; updated games.json" -ForegroundColor Green

