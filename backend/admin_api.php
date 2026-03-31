<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/db.php';

session_start();
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Admin privileges required.']);
    exit();
}

$input  = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

// -------------------------------------------------------
// ACTION: get_all_users
// -------------------------------------------------------
if ($action === 'get_users') {
    $stmt = $pdo->query("SELECT id, name, email, phone, country, city, role, status, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'users' => $users]);
    exit();
}

// -------------------------------------------------------
// ACTION: update_user_status (approve / block / unblock)
// -------------------------------------------------------
if ($action === 'update_status') {
    $userId    = intval($input['userId'] ?? 0);
    $newStatus = $input['status'] ?? '';
    
    if (!$userId || !in_array($newStatus, ['approved', 'blocked', 'pending'])) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid parameters.']);
        exit();
    }
    
    $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $userId]);
    
    // Notify user
    $userStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $row = $userStmt->fetch();
    if ($row) {
        $msg = $newStatus === 'approved' ? 'Your account has been approved! You can now log in.' : 'Your account status has been updated to: ' . $newStatus . '.';
        $pdo->prepare("INSERT INTO notifications (user_email, title, message) VALUES (?, 'Account Status Update', ?)")
            ->execute([$row['email'], $msg]);
    }
    
    echo json_encode(['status' => 'success', 'message' => "User status updated to $newStatus."]);
    exit();
}

// -------------------------------------------------------
// ACTION: get_dashboard_stats
// -------------------------------------------------------
if ($action === 'stats') {
    $users    = $pdo->query("SELECT COUNT(*) FROM users WHERE role='user'")->fetchColumn();
    $pending  = $pdo->query("SELECT COUNT(*) FROM users WHERE status='pending'")->fetchColumn();
    $bookings = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
    $revenue  = $pdo->query("SELECT SUM(total_amount) FROM bookings WHERE status='confirmed'")->fetchColumn();
    
    echo json_encode([
        'status'             => 'success',
        'totalUsers'         => $users,
        'pendingApprovals'   => $pending,
        'totalBookings'      => $bookings,
        'totalRevenue'       => $revenue ?? 0
    ]);
    exit();
}

// -------------------------------------------------------
// ACTION: update_booking_status
// -------------------------------------------------------
if ($action === 'update_booking') {
    $ref       = $input['booking_ref'] ?? '';
    $newStatus = $input['status'] ?? '';
    
    if (!$ref || !in_array($newStatus, ['confirmed', 'cancelled', 'completed'])) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid parameters.']);
        exit();
    }
    
    $stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE booking_ref = ?");
    $stmt->execute([$newStatus, $ref]);
    echo json_encode(['status' => 'success', 'message' => "Booking $ref updated to $newStatus."]);
    exit();
}

// -------------------------------------------------------
// ACTION: get_inventory  — list destinations + packages
// -------------------------------------------------------
if ($action === 'get_inventory') {
    $destinations = $pdo->query("SELECT id, name, category, price, airport, railway, 'destination' as type FROM destinations ORDER BY name ASC")->fetchAll();
    $packages     = $pdo->query("SELECT id, name, category, price, '' as airport, '' as railway, 'package' as type FROM packages ORDER BY name ASC")->fetchAll();
    $all = array_merge($packages, $destinations);
    echo json_encode(['status' => 'success', 'inventory' => $all]);
    exit();
}

// -------------------------------------------------------
// ACTION: add_inventory  — insert destination OR package
// -------------------------------------------------------
if ($action === 'add_inventory') {
    $type     = $input['type'] ?? 'destination';
    $name     = trim($input['name'] ?? '');
    $category = trim($input['category'] ?? '');
    $price    = floatval($input['price'] ?? 0);
    $airport  = trim($input['airport'] ?? '');
    $railway  = trim($input['railway'] ?? '');

    if (!$name || $price <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Name and price are required.']);
        exit();
    }

    if ($type === 'package') {
        $stmt = $pdo->prepare("INSERT INTO packages (name, category, price) VALUES (?,?,?)");
        $stmt->execute([$name, $category, $price]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO destinations (name, category, price, airport, railway) VALUES (?,?,?,?,?)");
        $stmt->execute([$name, $category, $price, $airport, $railway]);
    }

    echo json_encode(['status' => 'success', 'id' => $pdo->lastInsertId(), 'message' => "$name added."]);
    exit();
}

// -------------------------------------------------------
// ACTION: edit_inventory  — update destination OR package
// -------------------------------------------------------
if ($action === 'edit_inventory') {
    $type    = $input['type'] ?? 'destination';
    $id      = intval($input['id'] ?? 0);
    $name    = trim($input['name'] ?? '');
    $category= trim($input['category'] ?? '');
    $price   = floatval($input['price'] ?? 0);
    $airport = trim($input['airport'] ?? '');
    $railway = trim($input['railway'] ?? '');

    if (!$id || !$name) {
        echo json_encode(['status' => 'error', 'message' => 'ID and name are required.']);
        exit();
    }

    if ($type === 'package') {
        $stmt = $pdo->prepare("UPDATE packages SET name=?, category=?, price=? WHERE id=?");
        $stmt->execute([$name, $category, $price, $id]);
    } else {
        $stmt = $pdo->prepare("UPDATE destinations SET name=?, category=?, price=?, airport=?, railway=? WHERE id=?");
        $stmt->execute([$name, $category, $price, $airport, $railway, $id]);
    }

    echo json_encode(['status' => 'success', 'message' => "Item $id updated."]);
    exit();
}

// -------------------------------------------------------
// ACTION: delete_inventory  — remove destination OR package
// -------------------------------------------------------
if ($action === 'delete_inventory') {
    $type = $input['type'] ?? 'destination';
    $id   = intval($input['id'] ?? 0);

    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'ID required.']);
        exit();
    }

    $table = ($type === 'package') ? 'packages' : 'destinations';
    $stmt  = $pdo->prepare("DELETE FROM $table WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['status' => 'success', 'message' => "Item $id deleted."]);
    exit();
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
