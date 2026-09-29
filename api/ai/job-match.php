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

/*
|--------------------------------------------------------------------------
| Load Job
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
    'SELECT
        id,
        job_title,
        company_name,
        location,
        work_mode,
        employment_type,
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

if (empty($job['job_description'])) {
    jsonResponse([
        'success' => false,
        'message' => 'This job does not have enough description for AI analysis.',
    ], 422);
}

/*
|--------------------------------------------------------------------------
| Load Primary Resume
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
    'SELECT
        id,
        title,
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

if (!$resume || empty($resume['extracted_text'])) {
    jsonResponse([
        'success' => false,
        'message' => 'Add your resume before running AI Job Match.',
    ], 422);
}

/*
|--------------------------------------------------------------------------
| Groq Configuration
|--------------------------------------------------------------------------
*/

$apiKey = getenv('GROQ_API_KEY');

if ($apiKey === false || $apiKey === '') {
    jsonResponse([
        'success' => false,
        'message' => 'AI service is not configured.',
    ], 500);
}

$model = 'openai/gpt-oss-20b';

/*
|--------------------------------------------------------------------------
| Build AI Prompt
|--------------------------------------------------------------------------
*/

$prompt = <<<PROMPT
You are a career matching assistant.

Analyze the candidate resume against the job description.

Return ONLY valid JSON. Do not use markdown or code fences.

Required JSON structure:
{
  "match_score": 0,
  "strengths": ["string"],
  "matched_skills": ["string"],
  "missing_skills": ["string"],
  "recommendations": ["string"],
  "experience_alignment": "string"
}

Rules:
- match_score must be an integer from 0 to 100.
- Base the analysis only on the supplied resume and job.
- Do not invent candidate skills or experience.
- strengths must contain concrete evidence from the resume.
- missing_skills must only include requirements supported by the job description but absent from the resume.
- recommendations must be practical and concise.

JOB
Title: {$job['job_title']}
Company: {$job['company_name']}
Location: {$job['location']}
Work Mode: {$job['work_mode']}
Employment Type: {$job['employment_type']}

Job Description:
{$job['job_description']}

CANDIDATE RESUME
Professional Summary:
{$resume['professional_summary']}

Resume:
{$resume['extracted_text']}
PROMPT;

/*
|--------------------------------------------------------------------------
| Call Groq API
|--------------------------------------------------------------------------
*/

$payload = json_encode([
    'model' => $model,
    'messages' => [
        [
            'role' => 'system',
            'content' =>
                'You are a precise career analysis assistant that returns valid JSON only.',
        ],
        [
            'role' => 'user',
            'content' => $prompt,
        ],
    ],
    'temperature' => 0.2,
    'response_format' => [
        'type' => 'json_object',
    ],
]);

if ($payload === false) {
    jsonResponse([
        'success' => false,
        'message' => 'Unable to prepare AI request.',
    ], 500);
}

$curl = curl_init('https://api.groq.com/openai/v1/chat/completions');

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
        'message' => 'AI analysis request failed.',
    ], 502);
}

/*
|--------------------------------------------------------------------------
| Validate AI Response
|--------------------------------------------------------------------------
*/

$analysis = json_decode(
    $responseData['choices'][0]['message']['content'],
    true
);

if (!is_array($analysis)) {
    jsonResponse([
        'success' => false,
        'message' => 'AI returned an invalid analysis.',
    ], 502);
}

$matchScore = (int) ($analysis['match_score'] ?? -1);

if ($matchScore < 0 || $matchScore > 100) {
    jsonResponse([
        'success' => false,
        'message' => 'AI returned an invalid match score.',
    ], 502);
}

$strengths = $analysis['strengths'] ?? [];
$matchedSkills = $analysis['matched_skills'] ?? [];
$missingSkills = $analysis['missing_skills'] ?? [];
$recommendations = $analysis['recommendations'] ?? [];
$experienceAlignment = trim(
    (string) ($analysis['experience_alignment'] ?? '')
);

if (
    !is_array($strengths) ||
    !is_array($matchedSkills) ||
    !is_array($missingSkills) ||
    !is_array($recommendations)
) {
    jsonResponse([
        'success' => false,
        'message' => 'AI returned an invalid analysis structure.',
    ], 502);
}

/*
|--------------------------------------------------------------------------
| Store Analysis
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare(
    'INSERT INTO ai_job_analyses (
        user_id,
        job_id,
        resume_id,
        match_score,
        strengths,
        missing_skills,
        matched_skills,
        recommendations,
        experience_alignment,
        model_name
     ) VALUES (
        :user_id,
        :job_id,
        :resume_id,
        :match_score,
        :strengths,
        :missing_skills,
        :matched_skills,
        :recommendations,
        :experience_alignment,
        :model_name
     )'
);

$stmt->execute([
    'user_id' => $userId,
    'job_id' => $jobId,
    'resume_id' => (int) $resume['id'],
    'match_score' => $matchScore,
    'strengths' => json_encode($strengths),
    'missing_skills' => json_encode($missingSkills),
    'matched_skills' => json_encode($matchedSkills),
    'recommendations' => json_encode($recommendations),
    'experience_alignment' => $experienceAlignment,
    'model_name' => $model,
]);

jsonResponse([
    'success' => true,
    'message' => 'AI job match completed.',
    'analysis' => [
        'id' => (int) $pdo->lastInsertId(),
        'match_score' => $matchScore,
        'strengths' => $strengths,
        'matched_skills' => $matchedSkills,
        'missing_skills' => $missingSkills,
        'recommendations' => $recommendations,
        'experience_alignment' => $experienceAlignment,
    ],
]);