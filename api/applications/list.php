<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('GET');

$userId = requireAuthenticatedUser();

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

if (!$user) {
    jsonResponse([
        'success' => false,
        'message' => 'User not found.',
    ], 404);
}

$baseQuery = '
    SELECT
        a.id,
        a.status,
        a.applied_at,
        a.interview_at,
        a.created_at,
        a.updated_at,

        j.id AS job_id,
        j.job_title,
        j.company_name,
        j.location,
        j.work_mode,
        j.employment_type,
        j.job_url,
        j.job_description,

        u.id AS applicant_id,
        u.full_name AS applicant_name,
        u.email AS applicant_email

    FROM applications a

    INNER JOIN jobs j
        ON j.id = a.job_id

    INNER JOIN users u
        ON u.id = a.user_id
';

if ($user['role'] === 'owner') {
    $stmt = $pdo->prepare(
        $baseQuery . '
        ORDER BY a.updated_at DESC, a.id DESC'
    );

    $stmt->execute();
} else {
    $stmt = $pdo->prepare(
        $baseQuery . '
        WHERE a.user_id = :user_id
        ORDER BY a.updated_at DESC, a.id DESC'
    );

    $stmt->execute([
        'user_id' => $userId,
    ]);
}

jsonResponse([
    'success' => true,
    'applications' => $stmt->fetchAll(),
]);