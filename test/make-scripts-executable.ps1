# Script to set execute permissions on test scripts
# This script is helpful when working across Windows and Unix systems

Write-Host "Setting execute permissions on test scripts..." -ForegroundColor Cyan

# Check if the system is Windows
if ($IsWindows -or $env:OS -match "Windows") {
    Write-Host "Running on Windows system." -ForegroundColor Yellow
    Write-Host "Note: The execute permission is not needed on Windows, but this script will still mark the file as executable for Unix systems." -ForegroundColor Yellow
}

# Use git to set execute permission (works in both Git Bash and PowerShell with Git installed)
try {
    git update-index --chmod=+x test/run-tests.sh
    Write-Host "Execute permission set on test/run-tests.sh" -ForegroundColor Green
}
catch {
    Write-Host "Warning: Could not set execute permission on test/run-tests.sh. You may need to run 'chmod +x test/run-tests.sh' manually on Unix systems." -ForegroundColor Red
}

Write-Host "Script completed." -ForegroundColor Cyan

Write-Host "Setting execution policy for PowerShell script..."
# You might need admin privileges for this
try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "Execution policy set to RemoteSigned for current user" -ForegroundColor Green
}
catch {
    Write-Host "Failed to set execution policy. You may need to run this as administrator." -ForegroundColor Red
    Write-Host "Alternatively, run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
}

Write-Host "Scripts are now ready to use:" -ForegroundColor Cyan
Write-Host "- Windows: .\test\run-tests.ps1" -ForegroundColor Cyan
Write-Host "- Linux/macOS: ./test/run-tests.sh" -ForegroundColor Cyan