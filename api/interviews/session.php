<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('GET');

$userId = requireAuthenticatedUser();
$sessionId = (int) ($_GET['id'] ?? 0);

if ($sessionId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => 'A valid interview session is required.',
    ], 422);
}

$stmt = $pdo->prepare(
    'SELECT
        s.id,
        s.job_id,
        s.title,
        s.status,
        s.overall_score,
        s.feedback_summary,
        s.created_at,
        s.completed_at,
        j.job_title,
        j.company_name
     FROM interview_sessions s
     LEFT JOIN jobs j
        ON j.id = s.job_id
     WHERE s.id = :session_id
       AND s.user_id = :user_id
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

$stmt = $pdo->prepare(
    'SELECT
        id,
        question,
        user_answer,
        ai_feedback,
        score,
        display_order
     FROM interview_questions
     WHERE session_id = :session_id
     ORDER BY display_order ASC, id ASC'
);

$stmt->execute([
    'session_id' => $sessionId,
]);

$questions = $stmt->fetchAll();

foreach ($questions as &$question) {
    $question['id'] = (int) $question['id'];
    $question['display_order'] = (int) $question['display_order'];

    if ($question['score'] !== null) {
        $question['score'] = (int) $question['score'];
    }
}

unset($question);

$session['id'] = (int) $session['id'];

if ($session['job_id'] !== null) {
    $session['job_id'] = (int) $session['job_id'];
}

if ($session['overall_score'] !== null) {
    $session['overall_score'] =
        (int) $session['overall_score'];
}

jsonResponse([
    'success' => true,
    'session' => $session,
    'questions' => $questions,
]);