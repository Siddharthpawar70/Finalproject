<?php
/**
 * Admin Account Reset/Update Utility
 * Run this ONCE to ensure the admin account has the correct password hash.
 * URL: http://localhost/Global-Horizon-Tour-main/backend/reset_admin.php
 * DELETE this file after running it, for security.
 */
header("Content-Type: text/html");
require_once __DIR__ . '/db.php';

$password = 'admin123';
$hash = password_hash($password, PASSWORD_DEFAULT);

// First check if admin already exists with a working hash
$check = $pdo->query("SELECT id, password_hash FROM users WHERE email = 'admin@ght.com' LIMIT 1");
$existing = $check->fetch();

if ($existing) {
    // Update existing admin hash
    $pdo->prepare("UPDATE users SET password_hash = ?, role = 'admin', status = 'approved' WHERE email = 'admin@ght.com'")
        ->execute([$hash]);
    echo "<h3 style='color:green;'>✅ Admin password reset successfully!</h3>";
} else {
    // Insert fresh admin user
    $pdo->prepare("INSERT INTO users (name, email, phone, password_hash, role, status) VALUES ('Admin', 'admin@ght.com', '0000000000', ?, 'admin', 'approved')")
        ->execute([$hash]);
    echo "<h3 style='color:green;'>✅ Admin account created successfully!</h3>";
}

echo "<p><strong>Email:</strong> admin@ght.com</p>";
echo "<p><strong>Password:</strong> admin123</p>";
echo "<p><strong>New Hash:</strong> <code>$hash</code></p>";
echo "<br><p style='color:red;font-weight:bold;'>⚠️ DELETE this file (reset_admin.php) immediately after use!</p>";
?>
