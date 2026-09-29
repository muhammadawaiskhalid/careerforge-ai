<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('POST');

$data = getJsonInput();

$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');
$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

verifyCsrfToken($csrfToken);

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if ($email === '' || $password === '') {
    jsonResponse([
        'success' => false,
        'message' => 'Email and password are required.',
    ], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
    jsonResponse([
        'success' => false,
        'message' => 'Please enter a valid email address.',
    ], 422);
}

if (strlen($password) > 128) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid email or password.',
    ], 401);
}

/*
|--------------------------------------------------------------------------
| Find User
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
    'SELECT id, full_name, email, password_hash
     FROM users
     WHERE email = :email
     LIMIT 1'
);

$stmt->execute([
    'email' => $email,
]);

$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid email or password.',
    ], 401);
}

/*
|--------------------------------------------------------------------------
| Create Authenticated Session
|--------------------------------------------------------------------------
*/

session_regenerate_id(true);

$_SESSION['user_id'] = (int) $user['id'];

if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
    $newHash = password_hash($password, PASSWORD_DEFAULT);

    if ($newHash !== false) {
        $stmt = $pdo->prepare(
            'UPDATE users
             SET password_hash = :password_hash
             WHERE id = :id'
        );

        $stmt->execute([
            'password_hash' => $newHash,
            'id' => $user['id'],
        ]);
    }
}

jsonResponse([
    'success' => true,
    'message' => 'Login successful.',
    'user' => [
        'id' => (int) $user['id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
    ],
    'csrf_token' => $_SESSION['csrf_token'],
]);