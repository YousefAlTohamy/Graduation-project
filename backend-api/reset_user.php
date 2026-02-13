<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::where('email', 'test@example.com')->first();
if ($user) {
    $user->password = bcrypt('password');
    $user->save();
    echo "Password reset successfully for test@example.com\n";
    echo "You can now login with:\n";
    echo "Email: test@example.com\n";
    echo "Password: password\n";
} else {
    echo "User not found. Creating new user...\n";
    User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => bcrypt('password')
    ]);
    echo "User created successfully!\n";
}
