<?php
// Check PHP zip extension
echo "PHP Version: " . phpversion() . "\n";
echo "Zip Extension: " . (extension_loaded('zip') ? 'YES' : 'NO') . "\n";
echo "Fileinfo Extension: " . (extension_loaded('fileinfo') ? 'YES' : 'NO') . "\n";
echo "PHP.ini path: " . php_ini_loaded_file() . "\n";
echo "\nLoaded Extensions:\n";
$extensions = get_loaded_extensions();
sort($extensions);
foreach ($extensions as $ext) {
    echo "  - " . $ext . "\n";
}
?>