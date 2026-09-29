<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';

requireMethod('POST');

$data = getJsonInput();
$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

verifyCsrfToken($csrfToken);

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();

    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

session_destroy();

jsonResponse([
    'success' => true,
    'message' => 'Logged out successfully.',
]);