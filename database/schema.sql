CREATE DATABASE IF NOT EXISTS careerforge_ai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE careerforge_ai;


-- =========================================================
-- USERS
-- Authentication and account information
-- =========================================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- CAREER PROFILES
-- Professional information used throughout the platform
-- =========================================================

CREATE TABLE career_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    professional_title VARCHAR(150) NULL,
    location VARCHAR(150) NULL,
    career_summary TEXT NULL,
    years_experience DECIMAL(4,1) NULL,
    target_role VARCHAR(150) NULL,
    target_location VARCHAR(150) NULL,
    linkedin_url VARCHAR(255) NULL,
    github_url VARCHAR(255) NULL,
    portfolio_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_career_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- SKILLS
-- Reusable normalized skill catalogue
-- =========================================================

CREATE TABLE skills (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE user_skills (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    skill_id INT UNSIGNED NOT NULL,
    proficiency ENUM(
        'beginner',
        'intermediate',
        'advanced'
    ) NOT NULL DEFAULT 'intermediate',
    years_experience DECIMAL(4,1) NULL,

    UNIQUE KEY uq_user_skill (user_id, skill_id),

    CONSTRAINT fk_user_skills_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_skills_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- RESUMES
-- Users may maintain multiple resume versions
-- =========================================================

CREATE TABLE resumes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    file_path VARCHAR(255) NULL,
    original_filename VARCHAR(255) NULL,
    professional_summary TEXT NULL,
    extracted_text LONGTEXT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_resumes_user (user_id),

    CONSTRAINT fk_resumes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- JOB OPPORTUNITIES
-- Jobs saved by users for tracking and AI analysis
-- =========================================================

CREATE TABLE job_opportunities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    job_title VARCHAR(180) NOT NULL,
    company_name VARCHAR(180) NOT NULL,
    location VARCHAR(180) NULL,
    work_mode ENUM(
        'remote',
        'hybrid',
        'onsite',
        'unspecified'
    ) NOT NULL DEFAULT 'unspecified',
    employment_type ENUM(
        'full_time',
        'part_time',
        'contract',
        'internship',
        'unspecified'
    ) NOT NULL DEFAULT 'unspecified',
    job_url VARCHAR(500) NULL,
    job_description LONGTEXT NULL,
    source VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_jobs_user (user_id),

    CONSTRAINT fk_jobs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- APPLICATIONS
-- Tracks each opportunity through the career journey
-- =========================================================

CREATE TABLE applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    job_id INT UNSIGNED NOT NULL,
    status ENUM(
        'saved',
        'applied',
        'interview',
        'offer',
        'rejected',
        'withdrawn'
    ) NOT NULL DEFAULT 'saved',
    applied_at DATETIME NULL,
    interview_at DATETIME NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_job_application (user_id, job_id),
    INDEX idx_applications_user_status (user_id, status),

    CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id)
        REFERENCES job_opportunities(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- AI JOB ANALYSES
-- Structured AI results for resume-to-job matching
-- =========================================================

CREATE TABLE ai_job_analyses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    job_id INT UNSIGNED NOT NULL,
    resume_id INT UNSIGNED NULL,
    match_score TINYINT UNSIGNED NULL,
    strengths JSON NULL,
    missing_skills JSON NULL,
    matched_skills JSON NULL,
    recommendations JSON NULL,
    experience_alignment TEXT NULL,
    model_name VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_ai_analysis_user_job (user_id, job_id),

    CONSTRAINT fk_ai_analysis_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_analysis_job
        FOREIGN KEY (job_id)
        REFERENCES job_opportunities(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_analysis_resume
        FOREIGN KEY (resume_id)
        REFERENCES resumes(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_match_score
        CHECK (
            match_score IS NULL
            OR match_score BETWEEN 0 AND 100
        )
) ENGINE=InnoDB;


-- =========================================================
-- INTERVIEW SESSIONS
-- AI interview preparation sessions
-- =========================================================

CREATE TABLE interview_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    job_id INT UNSIGNED NULL,
    title VARCHAR(180) NOT NULL,
    status ENUM(
        'active',
        'completed'
    ) NOT NULL DEFAULT 'active',
    overall_score TINYINT UNSIGNED NULL,
    feedback_summary TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,

    INDEX idx_interviews_user (user_id),

    CONSTRAINT fk_interviews_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_interviews_job
        FOREIGN KEY (job_id)
        REFERENCES job_opportunities(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_interview_score
        CHECK (
            overall_score IS NULL
            OR overall_score BETWEEN 0 AND 100
        )
) ENGINE=InnoDB;


CREATE TABLE interview_questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    question TEXT NOT NULL,
    user_answer TEXT NULL,
    ai_feedback TEXT NULL,
    score TINYINT UNSIGNED NULL,
    display_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_interview_questions_session
        FOREIGN KEY (session_id)
        REFERENCES interview_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_question_score
        CHECK (
            score IS NULL
            OR score BETWEEN 0 AND 100
        )
) ENGINE=InnoDB;


-- =========================================================
-- COVER LETTERS
-- AI-assisted application documents
-- =========================================================

CREATE TABLE cover_letters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    job_id INT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_cover_letters_user (user_id),

    CONSTRAINT fk_cover_letters_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cover_letters_job
        FOREIGN KEY (job_id)
        REFERENCES job_opportunities(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- NOTIFICATIONS
-- User-specific platform notifications
-- =========================================================

CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'general',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notifications_user_read (
        user_id,
        is_read
    ),

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- AI USAGE LOGS
-- Operational audit trail for AI requests
-- =========================================================

CREATE TABLE ai_usage_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    feature VARCHAR(80) NOT NULL,
    provider VARCHAR(80) NULL,
    model_name VARCHAR(100) NULL,
    status ENUM(
        'success',
        'failed'
    ) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_ai_usage_user (user_id),

    CONSTRAINT fk_ai_usage_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;