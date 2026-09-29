<?php

declare(strict_types=1);

require_once __DIR__ . '/session.php';

function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function getJsonInput(): array
{
    $input = json_decode(
        file_get_contents('php://input'),
        true
    );

    return is_array($input) ? $input : [];
}

function verifyCsrfToken(?string $token): void
{
    if (
        empty($token) ||
        empty($_SESSION['csrf_token']) ||
        !hash_equals($_SESSION['csrf_token'], $token)
    ) {
        jsonResponse([
            'success' => false,
            'message' => 'Invalid security token.',
        ], 403);
    }
}

function requireMethod(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        jsonResponse([
            'success' => false,
            'message' => 'Method not allowed.',
        ], 405);
    }
}

function requireAuthenticatedUser(): int
{
    if (empty($_SESSION['user_id'])) {
        jsonResponse([
            'success' => false,
            'message' => 'Authentication required.',
        ], 401);
    }

    return (int) $_SESSION['user_id'];
}

function requireOwner(PDO $pdo): int
{
    $userId = requireAuthenticatedUser();

    $stmt = $pdo->prepare(
        'SELECT role
         FROM users
         WHERE id = :user_id
         LIMIT 1'
    );

    $stmt->execute([
        'user_id' => $userId,
    ]);

    $user = $stmt->fetch();

    if (!$user || $user['role'] !== 'owner') {
        jsonResponse([
            'success' => false,
            'message' => 'Owner access required.',
        ], 403);
    }

    return $userId;
}