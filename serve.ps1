param([int]$Port=5500)
Start-Process "http://localhost:$Port/"
python -m http.server $Port