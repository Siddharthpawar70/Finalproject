<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/db.php';

session_start();

$input  = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

/**
 * Placeholder for sending WhatsApp and Phone messages
 */
function sendMessageToUser($phone, $message) {
    // In a real application, you would use an API like Twilio or a WhatsApp Business API
    // For now, we'll log it to a local file for verification
    $logEntry = date('[Y-m-d H:i:s]') . " TO: $phone | MSG: $message" . PHP_EOL;
    file_put_contents(__DIR__ . '/message_logs.txt', $logEntry, FILE_APPEND);
    return true;
}

// -------------------------------------------------------
// ACTION: create_booking
// -------------------------------------------------------
if ($action === 'create') {
    $ref        = 'GHT' . strtoupper(substr(md5(uniqid()), 0, 7));
    $custName   = trim($input['name'] ?? '');
    $custPhone  = trim($input['mobile'] ?? '');
    $custEmail  = trim($input['email'] ?? '');
    $dest       = trim($input['dest'] ?? '');
    $date       = $input['date'] ?? '';
    $adults     = intval($input['adults'] ?? 1);
    $children   = intval($input['children'] ?? 0);
    $mode       = $input['mode'] ?? 'flight';
    $transDetail= json_encode($input['transportDetails'] ?? []);
    $notes      = $input['notes'] ?? '';
    $total      = floatval($input['total'] ?? 0);
    $payMethod  = $input['paymentMethod'] ?? 'UPI';
    $discount   = $input['offer'] ?? 'None';
    $userEmail  = $input['userEmail'] ?? $custEmail;

    // Server-side price verification
    $destStmt = $pdo->prepare("SELECT price FROM destinations WHERE name = ? UNION SELECT price FROM packages WHERE name = ? LIMIT 1");
    $destStmt->execute([$dest, $dest]);
    $priceRow = $destStmt->fetch();
    
    if ($priceRow) {
        $basePrice = floatval($priceRow['price']);
        $transportCost = 0;
        $totalPax = $adults + $children;
        if ($mode === 'flight') $transportCost = 5000 * $totalPax;
        elseif ($mode === 'train') $transportCost = 1500 * $totalPax;
        elseif ($mode === 'car') $transportCost = 2000; 

        $calculatedBase = ($basePrice * $adults) + ($basePrice * 0.5 * $children) + $transportCost;
        
        $discountPercent = 0;
        if (preg_match('/\((\d+)%\s*Off\)/i', $discount, $match)) {
            $discountPercent = intval($match[1]);
        } elseif (is_numeric($discount)) {
            $discountPercent = intval($discount);
        }
        
        $discountAmount = $calculatedBase * ($discountPercent / 100);
        $total = max(0, $calculatedBase - $discountAmount);
    } else {
        $total = floatval($input['total'] ?? 0);
    }

    if (!$custName || !$dest || !$date || !$total) {
        echo json_encode(['status' => 'error', 'message' => 'Required booking fields are missing.']);
        exit();
    }

    // Get user_id if logged in
    $userStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $userStmt->execute([$userEmail]);
    $userRow  = $userStmt->fetch();
    $userId   = $userRow ? $userRow['id'] : null;

    $stmt = $pdo->prepare("INSERT INTO bookings 
        (booking_ref, user_id, user_email, cust_name, cust_phone, cust_email, destination, travel_date, adults, children, transport_mode, transport_details, special_notes, total_amount, payment_method, discount_applied) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

    $stmt->execute([$ref, $userId, $userEmail, $custName, $custPhone, $custEmail, $dest, $date, $adults, $children, $mode, $transDetail, $notes, $total, $payMethod, $discount]);

    // Send WhatsApp & SMS (Placeholders)
    sendMessageToUser($custPhone, "Hello $custName! Your booking for $dest (Ref: $ref) is confirmed with Global Horizon Tour. Thank you for choosing us!");

    // Add booking notification
    $pdo->prepare("INSERT INTO notifications (user_email, title, message) VALUES (?, ?, ?)")
        ->execute([$userEmail, "Booking Confirmed - $dest", "Your booking (Ref: $ref) for $dest on $date is confirmed!"]);

    echo json_encode(['status' => 'success', 'booking_ref' => $ref, 'message' => 'Booking confirmed! Receipt generated.']);
    exit();
}

// -------------------------------------------------------
// ACTION: get_user_bookings
// -------------------------------------------------------
if ($action === 'get_user') {
    if (!isset($_SESSION['user_email'])) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Login required.']);
        exit();
    }
    $userEmail = $_SESSION['user_email'];
    
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE user_email = ? ORDER BY created_at DESC");
    $stmt->execute([$userEmail]);
    $bookings = $stmt->fetchAll();
    
    echo json_encode(['status' => 'success', 'bookings' => $bookings]);
    exit();
}

// -------------------------------------------------------
// ACTION: get_all (Admin only)
// -------------------------------------------------------
if ($action === 'get_all') {
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Admin privileges required.']);
        exit();
    }
    $stmt = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC");
    $bookings = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'bookings' => $bookings]);
    exit();
}

// -------------------------------------------------------
// ACTION: cancel
// -------------------------------------------------------
if ($action === 'cancel') {
    $ref = $input['booking_ref'] ?? '';
    if (!$ref) { echo json_encode(['status' => 'error', 'message' => 'Booking ref required.']); exit(); }
    
    if (!isset($_SESSION['user_email']) && !isset($_SESSION['user_role'])) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized.']); exit();
    }
    
    if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin') {
        $stmt = $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE booking_ref = ?");
        $stmt->execute([$ref]);
    } else {
        $userEmail = $_SESSION['user_email'];
        $stmt = $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE booking_ref = ? AND user_email = ?");
        $stmt->execute([$ref, $userEmail]);
        if ($stmt->rowCount() === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Booking not found or no permission to cancel.']); exit();
        }
    }
    echo json_encode(['status' => 'success', 'message' => 'Booking cancelled.']);
    exit();
}

// -------------------------------------------------------
// ACTION: get_single
// -------------------------------------------------------
if ($action === 'get_single') {
    $ref = $input['ref'] ?? $_GET['ref'] ?? '';
    if (!$ref) { echo json_encode(['status' => 'error', 'message' => 'Booking ref required.']); exit(); }
    
    if (!isset($_SESSION['user_email']) && !isset($_SESSION['user_role'])) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized.']); exit();
    }
    
    if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin') {
        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE booking_ref = ? LIMIT 1");
        $stmt->execute([$ref]);
    } else {
        $userEmail = $_SESSION['user_email'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE booking_ref = ? AND user_email = ? LIMIT 1");
        $stmt->execute([$ref, $userEmail]);
    }
    $booking = $stmt->fetch();
    
    if (!$booking) { echo json_encode(['status' => 'error', 'message' => 'Booking not found.']); exit(); }
    
    echo json_encode(['status' => 'success', 'booking' => $booking]);
    exit();
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);

