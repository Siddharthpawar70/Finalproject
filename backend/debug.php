<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db.php';

$response = [
    'php_version' => PHP_VERSION,
    'database' => [
        'status' => 'unknown',
        'details' => ''
    ],
    'files' => []
];

// Check DB
try {
    $stmt = $pdo->query("SELECT 1");
    if ($stmt) {
        $response['database']['status'] = 'connected';
        $response['database']['details'] = 'Connection successful and query executed.';
    }
} catch (Exception $e) {
    $response['database']['status'] = 'error';
    $response['database']['details'] = $e->getMessage();
}

// Check essential files
$essentials = ['db.php', 'booking_api.php', 'login_api.php', 'schema.sql', 'setup.php'];
foreach ($essentials as $file) {
    if (file_exists(__DIR__ . '/' . $file)) {
        $response['files'][$file] = 'exists';
    } else {
        $response['files'][$file] = 'MISSING';
    }
}

// Check tables
if ($response['database']['status'] === 'connected') {
    try {
        $tables = ['users', 'bookings', 'packages', 'destinations', 'notifications'];
        $response['tables'] = [];
        foreach ($tables as $table) {
            $check = $pdo->query("SHOW TABLES LIKE '$table'");
            $response['tables'][$table] = ($check->rowCount() > 0) ? 'Ready' : 'NOT FOUND (Run setup.php)';
        }

        // Check Admin User
        $adminCheck = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        $response['admin_user'] = ($adminCheck->fetchColumn() > 0) ? 'Exists' : 'MISSING';
    } catch (Exception $e) {
        $response['admin_user_error'] = $e->getMessage();
    }
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>
