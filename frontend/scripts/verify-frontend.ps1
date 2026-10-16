$proc = Start-Process npx -ArgumentList 'next', 'start', '-p', '3000' -WorkingDirectory 'frontend' -PassThru
Start-Sleep -Seconds 4
try {
    Write-Output "=== TESTING HTTP 200 ON http://localhost:3000 ==="
    $res = & curl.exe -s -I http://localhost:3000/
    Write-Output $res
    Write-Output "`n=== CHECKING HTML CONTENT ==="
    $html = & curl.exe -s http://localhost:3000/
    $hasAuraCura = $html -match "AuraCura" -or $html -match "AURACURA"
    $hasBioHarmonic = $html -match "Bio-Harmonic"
    $hasObsidian = $html -match "070709"
    Write-Output "Contains 'AuraCura': $hasAuraCura"
    Write-Output "Contains 'Bio-Harmonic': $hasBioHarmonic"
    Write-Output "Contains Obsidian '#070709': $hasObsidian"
} finally {
    Stop-Process -Id $proc.Id -Force
}
