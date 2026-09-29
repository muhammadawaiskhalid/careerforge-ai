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

$resumeId = (int) ($data['resume_id'] ?? 0);
$title = trim((string) ($data['title'] ?? ''));
$professionalSummary = trim(
    (string) ($data['professional_summary'] ?? '')
);
$extractedText = trim(
    (string) ($data['extracted_text'] ?? '')
);
$isPrimary = !empty($data['is_primary']) ? 1 : 0;

if ($title === '') {
    jsonResponse([
        'success' => false,
        'message' => 'Resume title is required.',
    ], 422);
}

if (mb_strlen($title) > 150) {
    jsonResponse([
        'success' => false,
        'message' => 'Resume title must not exceed 150 characters.',
    ], 422);
}

if ($extractedText === '') {
    jsonResponse([
        'success' => false,
        'message' => 'Resume content is required.',
    ], 422);
}

try {
    $pdo->beginTransaction();

    if ($isPrimary === 1) {
        $stmt = $pdo->prepare(
            'UPDATE resumes
             SET is_primary = 0
             WHERE user_id = :user_id'
        );

        $stmt->execute([
            'user_id' => $userId,
        ]);
    }

    if ($resumeId > 0) {
        $stmt = $pdo->prepare(
            'UPDATE resumes
             SET
                title = :title,
                professional_summary = :professional_summary,
                extracted_text = :extracted_text,
                is_primary = :is_primary
             WHERE id = :resume_id
               AND user_id = :user_id'
        );

        $stmt->execute([
            'title' => $title,
            'professional_summary' =>
                $professionalSummary !== ''
                    ? $professionalSummary
                    : null,
            'extracted_text' => $extractedText,
            'is_primary' => $isPrimary,
            'resume_id' => $resumeId,
            'user_id' => $userId,
        ]);

        if ($stmt->rowCount() === 0) {
            $checkStmt = $pdo->prepare(
                'SELECT id
                 FROM resumes
                 WHERE id = :resume_id
                   AND user_id = :user_id
                 LIMIT 1'
            );

            $checkStmt->execute([
                'resume_id' => $resumeId,
                'user_id' => $userId,
            ]);

            if (!$checkStmt->fetch()) {
                $pdo->rollBack();

                jsonResponse([
                    'success' => false,
                    'message' => 'Resume not found.',
                ], 404);
            }
        }
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO resumes (
                user_id,
                title,
                professional_summary,
                extracted_text,
                is_primary
             ) VALUES (
                :user_id,
                :title,
                :professional_summary,
                :extracted_text,
                :is_primary
             )'
        );

        $stmt->execute([
            'user_id' => $userId,
            'title' => $title,
            'professional_summary' =>
                $professionalSummary !== ''
                    ? $professionalSummary
                    : null,
            'extracted_text' => $extractedText,
            'is_primary' => $isPrimary,
        ]);

        $resumeId = (int) $pdo->lastInsertId();
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Resume saved successfully.',
        'resume_id' => $resumeId,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => 'Unable to save resume.',
    ], 500);
}