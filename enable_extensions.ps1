# Enable PHP extensions - corrected version
$phpIniPath = "C:\php-8.5.3\php.ini"

# Read the file
$content = Get-Content $phpIniPath

# Find and uncomment the lines
$newContent = @()
foreach ($line in $content) {
    if ($line -match '^\s*;extension=fileinfo\s*$') {
        $newContent += 'extension=fileinfo'
        Write-Host "✓ Uncommented fileinfo"
    } elseif ($line -match '^\s*;extension=zip\s*$') {
        $newContent += 'extension=zip'
        Write-Host "✓ Uncommented zip"
    } else {
        $newContent += $line
    }
}

# Write back
Set-Content $phpIniPath $newContent -Encoding UTF8

# Verify immediately
Write-Host "`nVerifying (this test may not reflect changes yet)..."
php -r "echo 'Zip: ' . (extension_loaded('zip') ? 'YES' : 'NO') . PHP_EOL; echo 'Fileinfo: ' . (extension_loaded('fileinfo') ? 'YES' : 'NO') . PHP_EOL;"

Write-Host "`nExtensions should be enabled after restarting PHP/composer."
