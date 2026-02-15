<?php
// Find extension directory
$ext_dir = ini_get('extension_dir');
echo "Extension Directory: " . $ext_dir . "\n\n";

// List available extensions
echo "Available Extensions (*.dll):\n";
$extensions = glob($ext_dir . "/*.dll");
if (empty($extensions)) {
    echo "No extensions found in directory\n";
} else {
    sort($extensions);
    foreach ($extensions as $ext) {
        $name = basename($ext);
        echo "  - " . $name . "\n";
        if (strpos($name, 'zip') !== false) {
            echo "    ^ ZIP EXTENSION FOUND!\n";
        }
        if (strpos($name, 'fileinfo') !== false) {
            echo "    ^ FILEINFO EXTENSION FOUND!\n";
        }
    }
}
?>