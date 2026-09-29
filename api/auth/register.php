<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('POST');

$data = getJsonInput();

$fullName = trim((string) ($data['full_name'] ?? ''));
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');
$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

verifyCsrfToken($csrfToken);

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if ($fullName === '' || $email === '' || $password === '') {
    jsonResponse([
        'success' => false,
        'message' => 'Full name, email and password are required.',
    ], 422);
}

if (mb_strlen($fullName) < 2 || mb_strlen($fullName) > 100) {
    jsonResponse([
        'success' => false,
        'message' => 'Full name must be between 2 and 100 characters.',
    ], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
    jsonResponse([
        'success' => false,
        'message' => 'Please enter a valid email address.',
    ], 422);
}

if (strlen($password) < 8 || strlen($password) > 128) {
    jsonResponse([
        'success' => false,
        'message' => 'Password must be between 8 and 128 characters.',
    ], 422);
}

/*
|--------------------------------------------------------------------------
| Check Existing Account
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
    'SELECT id
     FROM users
     WHERE email = :email
     LIMIT 1'
);

$stmt->execute([
    'email' => $email,
]);

if ($stmt->fetch()) {
    jsonResponse([
        'success' => false,
        'message' => 'An account with this email already exists.',
    ], 409);
}

/*
|--------------------------------------------------------------------------
| Create Account
|--------------------------------------------------------------------------
*/

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

if ($passwordHash === false) {
    jsonResponse([
        'success' => false,
        'message' => 'Unable to create account.',
    ], 500);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'INSERT INTO users (
            full_name,
            email,
            password_hash
        ) VALUES (
            :full_name,
            :email,
            :password_hash
        )'
    );

    $stmt->execute([
        'full_name' => $fullName,
        'email' => $email,
        'password_hash' => $passwordHash,
    ]);

    $userId = (int) $pdo->lastInsertId();

    /*
     * Every account receives its own career profile.
     */
    $stmt = $pdo->prepare(
        'INSERT INTO career_profiles (user_id)
         VALUES (:user_id)'
    );

    $stmt->execute([
        'user_id' => $userId,
    ]);

    $pdo->commit();

    /*
     * Prevent session fixation after authentication.
     */
    session_regenerate_id(true);

    $_SESSION['user_id'] = $userId;

    jsonResponse([
        'success' => true,
        'message' => 'Account created successfully.',
        'user' => [
            'id' => $userId,
            'full_name' => $fullName,
            'email' => $email,
        ],
        'csrf_token' => $_SESSION['csrf_token'],
    ], 201);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => 'Unable to create account.',
    ], 500);
}