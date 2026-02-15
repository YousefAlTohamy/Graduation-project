# Enable PDO SQLite extension in php.ini
$phpIniPath = "C:\php-8.5.3\php.ini"

# Read the file
$content = Get-Content $phpIniPath

# Check if already enabled
if ($content -match "^\s*extension\s*=\s*pdo_sqlite") {
    Write-Host "PDO SQLite already enabled" -ForegroundColor Green
    exit 0
}

# Uncomment the line
$content = $content -replace "^\s*;\s*extension\s*=\s*pdo_sqlite", "extension=pdo_sqlite"

# Write back
Set-Content $phpIniPath $content

Write-Host "PDO SQLite extension enabled" -ForegroundColor Green
