<?php
$file = 'composer.phar';
if (!file_exists($file)) {
    die("File not found: $file\n");
}

echo "--- Phar Validity Check ---\n";
try {
    if (Phar::isValidPhar($file)) {
        echo "Phar is structurally valid.\n";
        $p = new Phar($file);
        echo "Successfully opened as Phar object.\n";
        echo "Metadata: " . var_export($p->getMetadata(), true) . "\n";
    } else {
        echo "Phar is NOT structurally valid according to Phar::isValidPhar().\n";
    }
} catch (Exception $e) {
    echo "Phar Error: " . $e->getMessage() . "\n";
}

$content = file_get_contents($file);
$haltPos = strpos($content, '__HALT_COMPILER();');

if ($haltPos !== false) {
    $beforeHalt = substr($content, 0, $haltPos);
    $haltLine = substr_count($beforeHalt, "\n") + 1;
    echo "Halt at line: $haltLine\n";
} else {
    echo "Halt not found in whole file.\n";
}

$f = fopen($file, 'r');
$line = 1;
echo "--- Lines 310-330 ---\n";
while ($line <= 330 && !feof($f)) {
    $content = fgets($f);
    if ($line >= 310) {
        printf("%d: %s", $line, $content);
    }
    $line++;
}
fclose($f);
