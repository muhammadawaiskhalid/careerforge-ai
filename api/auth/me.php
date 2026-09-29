<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('GET');

if (empty($_SESSION['user_id'])) {
    jsonResponse([
        'success' => true,
        'authenticated' => false,
        'user' => null,
        'csrf_token' => $_SESSION['csrf_token'],
    ]);
}

$userId = (int) $_SESSION['user_id'];

$stmt = $pdo->prepare(
    'SELECT id, full_name, email, avatar, role
     FROM users
     WHERE id = :id
     LIMIT 1'
);

$stmt->execute([
    'id' => $userId,
]);

$user = $stmt->fetch();

if (!$user) {
    unset($_SESSION['user_id']);
    session_regenerate_id(true);

    jsonResponse([
        'success' => true,
        'authenticated' => false,
        'user' => null,
        'csrf_token' => $_SESSION['csrf_token'],
    ]);
}

jsonResponse([
    'success' => true,
    'authenticated' => true,
    'user' => [
        'id' => (int) $user['id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'avatar' => $user['avatar'],
        'role' => $user['role'],
    ],
    'csrf_token' => $_SESSION['csrf_token'],
]);