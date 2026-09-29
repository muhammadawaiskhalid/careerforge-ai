<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('GET');

$userId = requireAuthenticatedUser();

/* Application Counts */

$stmt = $pdo->prepare(
    'SELECT
        COUNT(*) AS total,
        SUM(status = \'saved\') AS saved,
        SUM(status = \'applied\') AS applied,
        SUM(status = \'interview\') AS interview,
        SUM(status = \'offer\') AS offer,
        SUM(status = \'rejected\') AS rejected,
        SUM(status = \'withdrawn\') AS withdrawn
     FROM applications
     WHERE user_id = :user_id'
);

$stmt->execute([
    'user_id' => $userId,
]);

$applications = $stmt->fetch();

/* Resume */

$stmt = $pdo->prepare(
    'SELECT COUNT(*) AS total
     FROM resumes
     WHERE user_id = :user_id'
);

$stmt->execute([
    'user_id' => $userId,
]);

$resumeCount = (int) $stmt->fetchColumn();

/* AI Job Analyses */

$stmt = $pdo->prepare(
    'SELECT
        COUNT(*) AS total,
        ROUND(AVG(match_score)) AS average_match,
        MAX(match_score) AS best_match
     FROM ai_job_analyses
     WHERE user_id = :user_id'
);

$stmt->execute([
    'user_id' => $userId,
]);

$analyses = $stmt->fetch();

/* Interview Performance */

$stmt = $pdo->prepare(
    'SELECT
        COUNT(*) AS total,
        ROUND(AVG(overall_score)) AS average_score,
        MAX(overall_score) AS best_score
     FROM interview_sessions
     WHERE user_id = :user_id
       AND status = \'completed\''
);

$stmt->execute([
    'user_id' => $userId,
]);

$interviews = $stmt->fetch();

/* Cover Letters */

$stmt = $pdo->prepare(
    'SELECT COUNT(*) AS total
     FROM cover_letters
     WHERE user_id = :user_id'
);

$stmt->execute([
    'user_id' => $userId,
]);

$coverLetterCount = (int) $stmt->fetchColumn();

/* Strongest Analyzed Job */

$stmt = $pdo->prepare(
    'SELECT
        a.match_score,
        j.id AS job_id,
        j.job_title,
        j.company_name
     FROM ai_job_analyses a
     INNER JOIN jobs j
        ON j.id = a.job_id
     WHERE a.user_id = :user_id
       AND a.match_score IS NOT NULL
     ORDER BY a.match_score DESC, a.created_at DESC
     LIMIT 1'
);

$stmt->execute([
    'user_id' => $userId,
]);

$strongestMatch = $stmt->fetch();

jsonResponse([
    'success' => true,
    'summary' => [
        'applications' => [
            'total' => (int) ($applications['total'] ?? 0),
            'saved' => (int) ($applications['saved'] ?? 0),
            'applied' => (int) ($applications['applied'] ?? 0),
            'interview' => (int) ($applications['interview'] ?? 0),
            'offer' => (int) ($applications['offer'] ?? 0),
            'rejected' => (int) ($applications['rejected'] ?? 0),
            'withdrawn' => (int) ($applications['withdrawn'] ?? 0),
        ],
        'resume_count' => $resumeCount,
        'ai_analyses' => [
            'total' => (int) ($analyses['total'] ?? 0),
            'average_match' => isset($analyses['average_match'])
                ? (int) $analyses['average_match']
                : null,
            'best_match' => isset($analyses['best_match'])
                ? (int) $analyses['best_match']
                : null,
        ],
        'interviews' => [
            'total' => (int) ($interviews['total'] ?? 0),
            'average_score' => isset($interviews['average_score'])
                ? (int) $interviews['average_score']
                : null,
            'best_score' => isset($interviews['best_score'])
                ? (int) $interviews['best_score']
                : null,
        ],
        'cover_letters' => $coverLetterCount,
        'strongest_match' => $strongestMatch
            ? [
                'job_id' => (int) $strongestMatch['job_id'],
                'job_title' => $strongestMatch['job_title'],
                'company_name' => $strongestMatch['company_name'],
                'match_score' => (int) $strongestMatch['match_score'],
            ]
            : null,
    ],
]);