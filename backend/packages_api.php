<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// ACTION: get_packages
if ($action === 'get_packages') {
    $stmt = $pdo->query("SELECT * FROM packages ORDER BY created_at DESC");
    $packages = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'packages' => $packages]);
    exit();
}

// ACTION: get_destinations
if ($action === 'get_destinations') {
    $stmt = $pdo->query("SELECT * FROM destinations ORDER BY created_at DESC");
    $destinations = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'destinations' => $destinations]);
    exit();
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
?>
