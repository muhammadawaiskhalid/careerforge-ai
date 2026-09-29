<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('GET');

requireAuthenticatedUser();

$stmt = $pdo->query(
    'SELECT
        id,
        job_title,
        company_name,
        location,
        work_mode,
        employment_type,
        job_url,
        job_description,
        source,
        created_at
     FROM jobs
     ORDER BY created_at DESC, id DESC'
);

jsonResponse([
    'success' => true,
    'jobs' => $stmt->fetchAll(),
]);