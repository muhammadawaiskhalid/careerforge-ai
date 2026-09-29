<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('GET');

$userId = requireAuthenticatedUser();

$stmt = $pdo->prepare(
    'SELECT
        id,
        title,
        file_path,
        original_filename,
        professional_summary,
        extracted_text,
        is_primary,
        created_at,
        updated_at
     FROM resumes
     WHERE user_id = :user_id
     ORDER BY is_primary DESC, updated_at DESC, id DESC'
);

$stmt->execute([
    'user_id' => $userId,
]);

$resumes = $stmt->fetchAll();

foreach ($resumes as &$resume) {
    $resume['id'] = (int) $resume['id'];
    $resume['is_primary'] = (bool) $resume['is_primary'];
}

unset($resume);

jsonResponse([
    'success' => true,
    'resumes' => $resumes,
]);