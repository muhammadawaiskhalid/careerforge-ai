<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/api.php';
require_once __DIR__ . '/../../config/database.php';

requireMethod('POST');

$ownerId = requireOwner($pdo);

$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
verifyCsrfToken($csrfToken);

$data = getJsonInput();

$jobTitle = trim((string) ($data['job_title'] ?? ''));
$companyName = trim((string) ($data['company_name'] ?? ''));
$location = trim((string) ($data['location'] ?? ''));
$workMode = strtolower(trim((string) ($data['work_mode'] ?? 'unspecified')));
$employmentType = strtolower(trim((string) ($data['employment_type'] ?? 'unspecified')));
$jobUrl = trim((string) ($data['job_url'] ?? ''));
$jobDescription = trim((string) ($data['job_description'] ?? ''));
$source = trim((string) ($data['source'] ?? ''));

$allowedWorkModes = [
    'remote',
    'hybrid',
    'onsite',
    'unspecified',
];

$allowedEmploymentTypes = [
    'full_time',
    'part_time',
    'contract',
    'internship',
    'unspecified',
];

if ($jobTitle === '' || $companyName === '') {
    jsonResponse([
        'success' => false,
        'message' => 'Job title and company are required.',
    ], 422);
}

if (mb_strlen($jobTitle) > 180) {
    jsonResponse([
        'success' => false,
        'message' => 'Job title must not exceed 180 characters.',
    ], 422);
}

if (mb_strlen($companyName) > 180) {
    jsonResponse([
        'success' => false,
        'message' => 'Company name must not exceed 180 characters.',
    ], 422);
}

if (mb_strlen($location) > 180) {
    jsonResponse([
        'success' => false,
        'message' => 'Location must not exceed 180 characters.',
    ], 422);
}

if (!in_array($workMode, $allowedWorkModes, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid work mode.',
    ], 422);
}

if (!in_array($employmentType, $allowedEmploymentTypes, true)) {
    jsonResponse([
        'success' => false,
        'message' => 'Invalid employment type.',
    ], 422);
}

if (
    $jobUrl !== '' &&
    (
        mb_strlen($jobUrl) > 500 ||
        filter_var($jobUrl, FILTER_VALIDATE_URL) === false
    )
) {
    jsonResponse([
        'success' => false,
        'message' => 'Enter a valid job URL.',
    ], 422);
}

if (mb_strlen($source) > 100) {
    jsonResponse([
        'success' => false,
        'message' => 'Source must not exceed 100 characters.',
    ], 422);
}

$stmt = $pdo->prepare(
    'INSERT INTO jobs (
        created_by,
        job_title,
        company_name,
        location,
        work_mode,
        employment_type,
        job_url,
        job_description,
        source
    ) VALUES (
        :created_by,
        :job_title,
        :company_name,
        :location,
        :work_mode,
        :employment_type,
        :job_url,
        :job_description,
        :source
    )'
);

$stmt->execute([
    'created_by' => $ownerId,
    'job_title' => $jobTitle,
    'company_name' => $companyName,
    'location' => $location !== '' ? $location : null,
    'work_mode' => $workMode,
    'employment_type' => $employmentType,
    'job_url' => $jobUrl !== '' ? $jobUrl : null,
    'job_description' => $jobDescription !== '' ? $jobDescription : null,
    'source' => $source !== '' ? $source : null,
]);

$jobId = (int) $pdo->lastInsertId();

jsonResponse([
    'success' => true,
    'message' => 'Job published successfully.',
    'job' => [
        'id' => $jobId,
        'job_title' => $jobTitle,
        'company_name' => $companyName,
        'location' => $location !== '' ? $location : null,
        'work_mode' => $workMode,
        'employment_type' => $employmentType,
        'job_url' => $jobUrl !== '' ? $jobUrl : null,
        'job_description' => $jobDescription !== '' ? $jobDescription : null,
        'source' => $source !== '' ? $source : null,
    ],
], 201);
