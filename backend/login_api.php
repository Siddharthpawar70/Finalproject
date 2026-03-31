<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/db.php';

session_start();

$input = json_decode(file_get_contents('php://input'), true);

$loginId  = strtolower(trim($input['loginId'] ?? ''));
$password = $input['password'] ?? '';

if (!$loginId || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Email/Phone and password are required.']);
    exit();
}

// Find user by email or phone
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1");
$stmt->execute([$loginId, $loginId]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email/mobile or password.']);
    exit();
}

if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email/mobile or password.']);
    exit();
}

if ($user['status'] === 'pending') {
    echo json_encode(['status' => 'error', 'message' => 'Your account is pending admin approval.']);
    exit();
}

if ($user['status'] === 'blocked') {
    echo json_encode(['status' => 'error', 'message' => 'Your account has been blocked by admin.']);
    exit();
}

// Create session
$_SESSION['user_id']    = $user['id'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_role']  = $user['role'];

// Add login notification
$pdo->prepare("INSERT INTO notifications (user_email, title, message) VALUES (?, 'Login Successful', ?)")
    ->execute([$user['email'], 'You logged in at ' . date('d M Y, h:i A')]);

// Return safe user data (no password)
$userData = [
    'id'      => $user['id'],
    'name'    => $user['name'],
    'email'   => $user['email'],
    'phone'   => $user['phone'],
    'country' => $user['country'],
    'city'    => $user['city'],
    'role'    => $user['role'],
    'status'  => $user['status']
];

echo json_encode(['status' => 'success', 'message' => 'Login successful!', 'user' => $userData]);
