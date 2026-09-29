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

if ($jobId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => 'A valid job is required.',
    ], 422);
}

/* Load Job */

$stmt = $pdo->prepare(
    'SELECT id, job_title, company_name, job_description
     FROM jobs
     WHERE id = :job_id
     LIMIT 1'
);

$stmt->execute(['job_id' => $jobId]);
$job = $stmt->fetch();

if (!$job || empty($job['job_description'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Job description is required for interview preparation.',
    ], 422);
}

/* Load Resume */

$stmt = $pdo->prepare(
    'SELECT id, professional_summary, extracted_text
     FROM resumes
     WHERE user_id = :user_id
     ORDER BY is_primary DESC, updated_at DESC
     LIMIT 1'
);

$stmt->execute(['user_id' => $userId]);
$resume = $stmt->fetch();

if (!$resume || empty($resume['extracted_text'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Add your resume before starting an AI interview.',
    ], 422);
}

/* Groq */

$apiKey = getenv('GROQ_API_KEY');

if (!$apiKey) {
    jsonResponse([
        'success' => false,
        'message' => 'AI service is not configured.',
    ], 500);
}

$model = 'openai/gpt-oss-20b';

$prompt = <<<PROMPT
You are conducting a professional job interview for the role below.

Generate exactly 5 interview questions based primarily on the JOB DESCRIPTION and its requirements.

Return ONLY valid JSON:
{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ]
}

STRICT RULES:
- Questions must evaluate whether the candidate can perform this specific job.
- Focus on skills, technologies, responsibilities, experience level, and competencies required by the job description.
- Do NOT ask about named personal projects, portfolio projects, project titles, companies, or products mentioned in the candidate resume.
- Do NOT ask questions such as "In your TaskFlow project..." or "Tell me about Virelio Finance..."
- The resume may only help calibrate the difficulty and avoid completely irrelevant questions.
- Questions must still be answerable by another candidate applying for the same role.
- Include technical and practical scenario-based questions where appropriate.
- Include at most one behavioral question.
- Do not reveal or reference the resume in the questions.
- Do not invent requirements that are absent from the job description.
- Keep each question concise and professional.

JOB TITLE:
{$job['job_title']}

COMPANY:
{$job['company_name']}

JOB DESCRIPTION:
{$job['job_description']}

CANDIDATE BACKGROUND FOR DIFFICULTY CALIBRATION ONLY:
{$resume['extracted_text']}
PROMPT;

$payload = json_encode([
    'model' => $model,
    'messages' => [
        [
            'role' => 'system',
            'content' => 'You are a professional interview coach. Return valid JSON only.',
        ],
        [
            'role' => 'user',
            'content' => $prompt,
        ],
    ],
    'temperature' => 0.4,
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
$statusCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
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
    !isset($responseData['choices'][0]['message']['content'])
) {
    jsonResponse([
        'success' => false,
        'message' => 'AI interview generation failed.',
    ], 502);
}

$result = json_decode(
    $responseData['choices'][0]['message']['content'],
    true
);

$questions = $result['questions'] ?? null;

if (!is_array($questions) || count($questions) !== 5) {
    jsonResponse([
        'success' => false,
        'message' => 'AI returned invalid interview questions.',
    ], 502);
}

/* Save Session + Questions */

try {
    $pdo->beginTransaction();

    $title = $job['job_title'] . ' Interview';

    $stmt = $pdo->prepare(
        'INSERT INTO interview_sessions (
            user_id,
            job_id,
            title,
            status
         ) VALUES (
            :user_id,
            :job_id,
            :title,
            \'active\'
         )'
    );

    $stmt->execute([
        'user_id' => $userId,
        'job_id' => $jobId,
        'title' => $title,
    ]);

    $sessionId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare(
        'INSERT INTO interview_questions (
            session_id,
            question,
            display_order
         ) VALUES (
            :session_id,
            :question,
            :display_order
         )'
    );

    foreach ($questions as $index => $question) {
        $question = trim((string) $question);

        if ($question === '') {
            throw new RuntimeException(
                'Invalid generated question.'
            );
        }

        $stmt->execute([
            'session_id' => $sessionId,
            'question' => $question,
            'display_order' => $index + 1,
        ]);
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'AI interview created.',
        'session' => [
            'id' => $sessionId,
            'title' => $title,
            'questions' => $questions,
        ],
    ], 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => 'Unable to create interview session.',
    ], 500);
}