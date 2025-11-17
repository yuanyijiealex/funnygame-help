$dir=Join-Path $PSScriptRoot '..\categories'
Get-ChildItem $dir -Filter *.html -File | ForEach-Object {
  $p=$_.FullName
  $c=Get-Content -Raw -LiteralPath $p
  $name=$_.Name
  $url="https://funnygame.help/categories/$name"
  $c=$c -replace 'funnygame\.com','funnygame.help'
  $c=[regex]::Replace($c,'og:url" content="[^"]+"','og:url" content="'+$url+'"')
  if($c -notmatch '<link rel="canonical"'){
    $insertion = "    <link rel=\"canonical\" href=\"$url\">`n"
    $c=[regex]::Replace($c,'(?is)(<meta property="og:type"[^>]*>\s*)','$1'+$insertion)
  }
  Set-Content -Encoding UTF8 -LiteralPath $p -Value $c
}

