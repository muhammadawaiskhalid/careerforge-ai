<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('POST');

$userId = requireAuthenticatedUser();

verifyCsrfToken(
    $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null
);

$data = getJsonInput();

$applicationId = (int) ($data['application_id'] ?? 0);
$status = trim((string) ($data['status'] ?? ''));

$allowedStatuses = [
    'applied',
    'interview',
    'offer',
    'rejected',
];

if (
    $applicationId <= 0 ||
    !in_array($status, $allowedStatuses, true)
) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid application or status.',
    ], 422);
}

/* Owner Authorization */

$userStmt = $pdo->prepare(
    'SELECT role
     FROM users
     WHERE id = :id
     LIMIT 1'
);

$userStmt->execute([
    'id' => $userId,
]);

$user = $userStmt->fetch();

if (!$user || $user['role'] !== 'owner') {
    jsonResponse([
        'success' => false,
        'message' => 'Only the platform owner can update application status.',
    ], 403);
}

/* Verify Application */

$stmt = $pdo->prepare(
    'SELECT id
     FROM applications
     WHERE id = :application_id
     LIMIT 1'
);

$stmt->execute([
    'application_id' => $applicationId,
]);

if (!$stmt->fetch()) {
    jsonResponse([
        'success' => false,
        'message' => 'Application not found.',
    ], 404);
}

/* Update Application Status */

if ($status === 'applied') {
    $stmt = $pdo->prepare(
        'UPDATE applications
         SET
            status = :status,
            applied_at = COALESCE(
                applied_at,
                CURRENT_TIMESTAMP
            )
         WHERE id = :application_id'
    );
} elseif ($status === 'interview') {
    $stmt = $pdo->prepare(
        'UPDATE applications
         SET
            status = :status,
            interview_at = COALESCE(
                interview_at,
                CURRENT_TIMESTAMP
            )
         WHERE id = :application_id'
    );
} else {
    $stmt = $pdo->prepare(
        'UPDATE applications
         SET status = :status
         WHERE id = :application_id'
    );
}

$stmt->execute([
    'status' => $status,
    'application_id' => $applicationId,
]);

jsonResponse([
    'success' => true,
    'message' => 'Application status updated successfully.',
    'application' => [
        'id' => $applicationId,
        'status' => $status,
    ],
]);