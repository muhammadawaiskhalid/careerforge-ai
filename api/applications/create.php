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

$jobId = (int) ($data['job_id'] ?? 0);
$status = strtolower(trim((string) ($data['status'] ?? 'saved')));

$allowedStatuses = [
    'saved',
    'applied',
];

if ($jobId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => 'A valid job is required.',
    ], 422);
}

if (!in_array($status, $allowedStatuses, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid application status.',
    ], 422);
}

/*
|--------------------------------------------------------------------------
| Verify Published Job
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
    'SELECT id
     FROM jobs
     WHERE id = :job_id
     LIMIT 1'
);

$stmt->execute([
    'job_id' => $jobId,
]);

if (!$stmt->fetch()) {
    jsonResponse([
        'success' => false,
        'message' => 'Job not found.',
    ], 404);
}

/*
|--------------------------------------------------------------------------
| Create or Update User Application
|--------------------------------------------------------------------------
*/

$appliedAt = $status === 'applied'
    ? date('Y-m-d H:i:s')
    : null;

try {
    $stmt = $pdo->prepare(
        'INSERT INTO applications (
            user_id,
            job_id,
            status,
            applied_at
        ) VALUES (
            :user_id,
            :job_id,
            :status,
            :applied_at
        )
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            applied_at = CASE
                WHEN VALUES(status) = \'applied\'
                    THEN COALESCE(applications.applied_at, VALUES(applied_at))
                ELSE applications.applied_at
            END'
    );

    $stmt->execute([
        'user_id' => $userId,
        'job_id' => $jobId,
        'status' => $status,
        'applied_at' => $appliedAt,
    ]);

    jsonResponse([
        'success' => true,
        'message' => $status === 'applied'
            ? 'Application marked as applied.'
            : 'Job saved successfully.',
        'application' => [
            'job_id' => $jobId,
            'status' => $status,
        ],
    ], 200);
} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Unable to update application.',
    ], 500);
}