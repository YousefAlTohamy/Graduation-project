<?php
$file = 'composer.phar';
$f = fopen($file, 'rb');
fseek($f, 0);
$currentLine = 1;
while ($currentLine < 315) {
    if (fgets($f) !== false)
        $currentLine++;
    else
        break;
}
echo "--- Context around line 320 ---\n";
for ($i = 315; $i <= 325; $i++) {
    $line = fgets($f);
    echo "Line $i: " . bin2hex($line) . " | " . addcslashes($line, "\0..\37!@\177..\377") . "\n";
}
fclose($f);
