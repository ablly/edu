# EduPilot AI - PostgreSQL Server Startup Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EduPilot AI - Starting Flask Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PostgreSQL Database URL
$env:DATABASE_URL = "postgresql://edupilot_user:050102@localhost:5432/edupilot_db"

Write-Host "[OK] Environment variable set" -ForegroundColor Green
Write-Host "     DATABASE_URL = $env:DATABASE_URL" -ForegroundColor Gray
Write-Host ""

# Stop existing Flask processes
Write-Host "Checking for existing Flask processes..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.ProcessName -like "*python*"}
if ($processes) {
    Write-Host "  Found $($processes.Count) Python process(es), stopping..." -ForegroundColor Yellow
    $processes | ForEach-Object { try { $_.Kill() } catch {} } 2>$null
    Start-Sleep -Seconds 2
    Write-Host "  [OK] Stopped old processes" -ForegroundColor Green
} else {
    Write-Host "  [OK] No existing processes" -ForegroundColor Green
}
Write-Host ""

# Start Flask server
Write-Host "Starting Flask server..." -ForegroundColor Yellow
Start-Process python -ArgumentList "app.py" -WindowStyle Hidden
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Flask Server Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Server Information:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  URL:       http://localhost:5000" -ForegroundColor White
Write-Host "  Database:  PostgreSQL (edupilot_db)" -ForegroundColor White
Write-Host "  Admin:     http://localhost:5000/admin/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server is running... Press Ctrl+C to stop" -ForegroundColor Green
Write-Host ""





