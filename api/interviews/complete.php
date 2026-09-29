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
$sessionId = (int) ($data['session_id'] ?? 0);

if ($sessionId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => 'A valid interview session is required.',
    ], 422);
}

/* Verify Session */

$stmt = $pdo->prepare(
    'SELECT id, status
     FROM interview_sessions
     WHERE id = :session_id
       AND user_id = :user_id
     LIMIT 1'
);

$stmt->execute([
    'session_id' => $sessionId,
    'user_id' => $userId,
]);

$session = $stmt->fetch();

if (!$session) {
    jsonResponse([
        'success' => false,
        'message' => 'Interview session not found.',
    ], 404);
}

/* Calculate Result */

$stmt = $pdo->prepare(
    'SELECT
        COUNT(*) AS total_questions,
        COUNT(score) AS answered_questions,
        ROUND(AVG(score)) AS overall_score
     FROM interview_questions
     WHERE session_id = :session_id'
);

$stmt->execute([
    'session_id' => $sessionId,
]);

$result = $stmt->fetch();

$totalQuestions = (int) $result['total_questions'];
$answeredQuestions = (int) $result['answered_questions'];

if (
    $totalQuestions === 0 ||
    $answeredQuestions !== $totalQuestions
) {
    jsonResponse([
        'success' => false,
        'message' => 'Answer all interview questions before completing the interview.',
    ], 422);
}

$overallScore = (int) $result['overall_score'];

if ($overallScore >= 85) {
    $feedback = 'Excellent interview performance with strong, relevant answers.';
} elseif ($overallScore >= 70) {
    $feedback = 'Strong performance with some opportunities to improve specificity and depth.';
} elseif ($overallScore >= 55) {
    $feedback = 'Good foundation, but several answers need stronger examples and clearer detail.';
} else {
    $feedback = 'More preparation is recommended before interviewing for this role.';
}

/* Complete Session */

$stmt = $pdo->prepare(
    'UPDATE interview_sessions
     SET
        status = \'completed\',
        overall_score = :overall_score,
        feedback_summary = :feedback_summary,
        completed_at = CURRENT_TIMESTAMP
     WHERE id = :session_id
       AND user_id = :user_id'
);

$stmt->execute([
    'overall_score' => $overallScore,
    'feedback_summary' => $feedback,
    'session_id' => $sessionId,
    'user_id' => $userId,
]);

jsonResponse([
    'success' => true,
    'message' => 'Interview completed successfully.',
    'result' => [
        'overall_score' => $overallScore,
        'feedback_summary' => $feedback,
    ],
]);