<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
session_start();

require_once __DIR__ . '/db.php';

$action    = $_GET['action'] ?? '';
$userEmail = $_GET['email'] ?? '';

// -------------------------------------------------------
// ACTION: get_notifications
// -------------------------------------------------------
if ($action === 'get' && $userEmail) {
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC LIMIT 20");
    $stmt->execute([$userEmail]);
    echo json_encode(['status' => 'success', 'notifications' => $stmt->fetchAll()]);
    exit();
}

// -------------------------------------------------------
// ACTION: mark_read
// -------------------------------------------------------
if ($action === 'mark_read' && $userEmail) {
    $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_email = ?")->execute([$userEmail]);
    echo json_encode(['status' => 'success']);
    exit();
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
