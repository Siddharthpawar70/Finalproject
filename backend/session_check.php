<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

session_start();

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'status' => 'success',
        'isLoggedIn' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'],
            'role' => $_SESSION['user_role']
        ]
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'isLoggedIn' => false,
        'message' => 'Not logged in.'
    ]);
}
