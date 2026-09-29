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
    'SELECT
        id,
        job_title,
        company_name,
        job_description
     FROM jobs
     WHERE id = :job_id
     LIMIT 1'
);

$stmt->execute([
    'job_id' => $jobId,
]);

$job = $stmt->fetch();

if (!$job) {
    jsonResponse([
        'success' => false,
        'message' => 'Job not found.',
    ], 404);
}

if (trim((string) $job['job_description']) === '') {
    jsonResponse([
        'success' => false,
        'message' => 'This job has no description to analyze.',
    ], 422);
}

/* Load User */

$stmt = $pdo->prepare(
    'SELECT full_name
     FROM users
     WHERE id = :user_id
     LIMIT 1'
);

$stmt->execute([
    'user_id' => $userId,
]);

$user = $stmt->fetch();

/* Load Primary / Latest Resume */

$stmt = $pdo->prepare(
    'SELECT
        professional_summary,
        extracted_text
     FROM resumes
     WHERE user_id = :user_id
     ORDER BY is_primary DESC, updated_at DESC
     LIMIT 1'
);

$stmt->execute([
    'user_id' => $userId,
]);

$resume = $stmt->fetch();

if (!$resume) {
    jsonResponse([
        'success' => false,
        'message' => 'Create your resume before generating a cover letter.',
    ], 422);
}

$resumeText = trim(
    (string) ($resume['extracted_text'] ?? '')
);

$professionalSummary = trim(
    (string) ($resume['professional_summary'] ?? '')
);

if ($resumeText === '' && $professionalSummary === '') {
    jsonResponse([
        'success' => false,
        'message' => 'Your resume does not contain enough information.',
    ], 422);
}

/* AI Generation */

$apiKey = getenv('GROQ_API_KEY');

if (!$apiKey) {
    jsonResponse([
        'success' => false,
        'message' => 'AI service is not configured.',
    ], 500);
}

$model = 'openai/gpt-oss-20b';

$prompt = <<<PROMPT
Write a professional and tailored cover letter for the candidate applying to the job below.

STRICT RULES:
- Return only the cover letter body as plain text.
- Do not return JSON.
- Do not use Markdown, headings, bullet points, or code fences.
- Tailor the letter specifically to the job requirements.
- Use only experience, skills, and qualifications supported by the candidate resume.
- Prioritize relevant skills, technical capabilities, and experience over named portfolio projects.
- Do not mention project names unless a project is directly important to demonstrating a specific job requirement.
- Never present personal, academic, or portfolio projects as employment or professional work experience.
- Do not use phrases such as "During my career" unless the resume explicitly supports professional employment history.
- Never invent employers, achievements, qualifications, technologies, or years of experience.
- Do not mention AI, prompts, resume analysis, match scores, or missing skills.
- Keep the tone confident, natural, concise, and professional.
- Use proper cover-letter paragraphs.
- Keep the letter approximately 250-350 words.

CANDIDATE:
{$user['full_name']}

PROFESSIONAL SUMMARY:
{$professionalSummary}

CANDIDATE RESUME:
{$resumeText}

JOB TITLE:
{$job['job_title']}

COMPANY:
{$job['company_name']}

JOB DESCRIPTION:
{$job['job_description']}
PROMPT;

$payload = json_encode([
    'model' => $model,
    'messages' => [
        [
            'role' => 'system',
            'content' =>
                'You are a professional career application assistant. Follow the supplied resume and job information exactly. Return only the requested cover letter body as plain text.',
        ],
        [
            'role' => 'user',
            'content' => $prompt,
        ],
    ],
    'temperature' => 0.4,
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

if ($statusCode < 200 || $statusCode >= 300) {
    jsonResponse([
        'success' => false,
        'message' =>
            $responseData['error']['message']
            ?? 'AI cover letter generation failed.',
    ], 502);
}

if (
    !isset(
        $responseData['choices'][0]['message']['content']
    )
) {
    jsonResponse([
        'success' => false,
        'message' => 'AI returned an unexpected response.',
    ], 502);
}

$content = trim(
    (string) $responseData['choices'][0]['message']['content']
);

$title = 'Cover Letter — ' . $job['job_title'];

if ($content === '') {
    jsonResponse([
        'success' => false,
        'message' => 'AI returned an empty cover letter.',
    ], 502);
}

/* Save Cover Letter */

$stmt = $pdo->prepare(
    'INSERT INTO cover_letters (
        user_id,
        job_id,
        title,
        content
     )
     VALUES (
        :user_id,
        :job_id,
        :title,
        :content
     )'
);

$stmt->execute([
    'user_id' => $userId,
    'job_id' => $jobId,
    'title' => $title,
    'content' => $content,
]);

$coverLetterId = (int) $pdo->lastInsertId();

jsonResponse([
    'success' => true,
    'message' => 'Cover letter generated successfully.',
    'cover_letter' => [
        'id' => $coverLetterId,
        'job_id' => $jobId,
        'title' => $title,
        'content' => $content,
    ],
]);