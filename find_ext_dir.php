<?php
// Get full extension dir
$ext_dir = ini_get('extension_dir');
echo "Relative ext_dir: " . $ext_dir . "\n";

// Get PHP directory
$php_dir = dirname(PHP_BINARY);
echo "PHP Directory: " . $php_dir . "\n";

// Check common locations
$common_locations = [
    $ext_dir,
    $php_dir . '/ext',
    'C:/php-8.5.3/ext',
    'C:\php-8.5.3\ext',
    realpath($php_dir . '/' . $ext_dir),
];

echo "\nChecking locations:\n";
foreach ($common_locations as $loc) {
    echo "\n  Checking: " . $loc . "\n";
    if (is_dir($loc)) {
        echo "    ✓ Directory exists\n";
        $files = @glob($loc . "/*.dll");
        if (!empty($files)) {
            echo "    Files found:\n";
            foreach ($files as $file) {
                echo "      - " . basename($file) . "\n";
            }
        } else {
            echo "    (no .dll files)\n";
        }
    } else {
        echo "    ✗ Directory not found\n";
    }
}
?>