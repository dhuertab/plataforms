param([int]$Port=5500)
Set-Location $PSScriptRoot
Start-Process "http://localhost:$Port/"
python -m http.server $Port
