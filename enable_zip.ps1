# Enable zip extension
$phpIni = 'C:\php-8.5.3\php.ini'
$content = Get-Content $phpIni
$newContent = $content -replace '^\s*;extension=zip\s*$', 'extension=zip'
Set-Content $phpIni $newContent -Encoding UTF8
Write-Host 'Zip extension uncommented'
