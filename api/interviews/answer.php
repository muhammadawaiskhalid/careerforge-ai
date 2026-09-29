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

$questionId = (int) ($data['question_id'] ?? 0);
$userAnswer = trim((string) ($data['answer'] ?? ''));

if ($questionId <= 0 || $userAnswer === '') {
    jsonResponse([
        'success' => false,
        'message' => 'Question and answer are required.',
    ], 422);
}

/* Load Question + Verify Ownership */

$stmt = $pdo->prepare(
    'SELECT
        q.id,
        q.question,
        q.session_id,
        s.status,
        j.job_title,
        j.job_description
     FROM interview_questions q
     INNER JOIN interview_sessions s
        ON s.id = q.session_id
     LEFT JOIN jobs j
        ON j.id = s.job_id
     WHERE q.id = :question_id
       AND s.user_id = :user_id
     LIMIT 1'
);

$stmt->execute([
    'question_id' => $questionId,
    'user_id' => $userId,
]);

$question = $stmt->fetch();

if (!$question) {
    jsonResponse([
        'success' => false,
        'message' => 'Interview question not found.',
    ], 404);
}

if ($question['status'] !== 'active') {
    jsonResponse([
        'success' => false,
        'message' => 'This interview is already completed.',
    ], 409);
}

/* Reject Answers That Are Too Short To Evaluate */

$wordCount = str_word_count($userAnswer);
$characterCount = mb_strlen($userAnswer);

if ($characterCount < 15 || $wordCount < 3) {
    $score = 0;
    $feedback =
        'The answer is too short to evaluate. Provide a clear, relevant explanation that directly addresses the interview question.';

    $stmt = $pdo->prepare(
        'UPDATE interview_questions
         SET
            user_answer = :user_answer,
            ai_feedback = :ai_feedback,
            score = :score
         WHERE id = :question_id'
    );

    $stmt->execute([
        'user_answer' => $userAnswer,
        'ai_feedback' => $feedback,
        'score' => $score,
        'question_id' => $questionId,
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Answer evaluated successfully.',
        'evaluation' => [
            'question_id' => $questionId,
            'score' => $score,
            'feedback' => $feedback,
        ],
    ]);
}

/* AI Evaluation */

$apiKey = getenv('GROQ_API_KEY');

if (!$apiKey) {
    jsonResponse([
        'success' => false,
        'message' => 'AI service is not configured.',
    ], 500);
}

$model = 'openai/gpt-oss-20b';

$prompt = <<<PROMPT
Evaluate the candidate's answer to this specific job interview question.

Return ONLY valid JSON:
{
  "score": 0,
  "feedback": "string"
}

SCORING GUIDE:
- 0-19: irrelevant, meaningless, extremely incomplete, or does not answer the question.
- 20-39: weak answer with major gaps or misunderstanding.
- 40-59: partially correct but lacks sufficient detail, clarity, or practical understanding.
- 60-74: acceptable and relevant answer demonstrating reasonable understanding.
- 75-89: strong, specific, technically sound, and professionally explained.
- 90-100: exceptional answer demonstrating excellent understanding, accuracy, depth, and practical reasoning.

STRICT RULES:
- Score must be an integer from 0 to 100.
- Judge the answer against the actual interview question and job requirements.
- Evaluate correctness, relevance, clarity, specificity, and practical understanding.
- Do not award points merely because an answer contains keywords.
- Random, unrelated, evasive, or nonsensical answers must receive a very low score.
- Do not invent information that the candidate did not provide.
- Feedback must explain the most important reason for the score.
- Feedback must be concise and constructive.

JOB:
{$question['job_title']}

JOB DESCRIPTION:
{$question['job_description']}

INTERVIEW QUESTION:
{$question['question']}

CANDIDATE ANSWER:
{$userAnswer}
PROMPT;

$payload = json_encode([
    'model' => $model,
    'messages' => [
        [
            'role' => 'system',
            'content' =>
                'You are a strict professional interview evaluator. Evaluate only the submitted answer against the question and job requirements. Return valid JSON only.',
        ],
        [
            'role' => 'user',
            'content' => $prompt,
        ],
    ],
    'temperature' => 0.1,
    'response_format' => [
        'type' => 'json_object',
    ],
]);

$curl = curl_init(
    'https://api.groq.com/openai/v1/chat/completions'
);

curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 45,
]);

$response = curl_exec($curl);
$statusCode = (int) curl_getinfo(
    $curl,
    CURLINFO_HTTP_CODE
);
$curlError = curl_error($curl);

curl_close($curl);

if ($response === false || $curlError !== '') {
    jsonResponse([
        'success' => false,
        'message' => 'Unable to connect to the AI service.',
    ], 502);
}

$responseData = json_decode($response, true);

if (
    $statusCode < 200 ||
    $statusCode >= 300 ||
    !isset(
        $responseData['choices'][0]['message']['content']
    )
) {
    jsonResponse([
        'success' => false,
        'message' => 'AI answer evaluation failed.',
    ], 502);
}

$result = json_decode(
    $responseData['choices'][0]['message']['content'],
    true
);

$score = (int) ($result['score'] ?? -1);
$feedback = trim(
    (string) ($result['feedback'] ?? '')
);

if (
    $score < 0 ||
    $score > 100 ||
    $feedback === ''
) {
    jsonResponse([
        'success' => false,
        'message' => 'AI returned invalid feedback.',
    ], 502);
}

/* Save Answer */

$stmt = $pdo->prepare(
    'UPDATE interview_questions
     SET
        user_answer = :user_answer,
        ai_feedback = :ai_feedback,
        score = :score
     WHERE id = :question_id'
);

$stmt->execute([
    'user_answer' => $userAnswer,
    'ai_feedback' => $feedback,
    'score' => $score,
    'question_id' => $questionId,
]);

jsonResponse([
    'success' => true,
    'message' => 'Answer evaluated successfully.',
    'evaluation' => [
        'question_id' => $questionId,
        'score' => $score,
        'feedback' => $feedback,
    ],
]);