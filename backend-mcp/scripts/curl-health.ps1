$proc = Start-Process node -ArgumentList '--no-warnings', '--loader', './backend-mcp/scripts/ts-loader.mjs', '--experimental-strip-types', 'backend-mcp/src/server.ts' -PassThru
Start-Sleep -Seconds 3
try {
    Write-Output "=== LIVE CURL http://localhost:3001/api/health ==="
    & curl.exe -s http://localhost:3001/api/health
    Write-Output "`n"
} finally {
    Stop-Process -Id $proc.Id -Force
}
