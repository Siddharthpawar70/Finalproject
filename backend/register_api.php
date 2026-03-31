<?php
// CORS headers for local testing with JS fetch
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/db.php';

session_start();

$input = json_decode(file_get_contents('php://input'), true);

$name    = trim($input['name'] ?? '');
$email   = strtolower(trim($input['email'] ?? ''));
$phone   = trim($input['phone'] ?? '');
$country = trim($input['country'] ?? '');
$city    = trim($input['city'] ?? '');
$password = $input['password'] ?? '';

if (!$name || !$email || !$phone || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Password must be at least 6 characters.']);
    exit();
}

// Check if user already exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR phone = ?");
$stmt->execute([$email, $phone]);
if ($stmt->rowCount() > 0) {
    echo json_encode(['status' => 'error', 'message' => 'An account with this email or phone already exists.']);
    exit();
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO users (name, email, phone, country, city, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')");
$stmt->execute([$name, $email, $phone, $country, $city, $passwordHash]);

// Add welcome notification
$pdo->prepare("INSERT INTO notifications (user_email, title, message) VALUES (?, 'Registration Successful', 'Welcome to GHT! Your account is pending admin approval.')")
    ->execute([$email]);

echo json_encode(['status' => 'success', 'message' => 'Registration successful! Your account is pending admin approval.']);
