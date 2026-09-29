import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

import {
  completeInterview,
  getInterviewSession,
  startInterview,
  submitInterviewAnswer,
} from "../services/interviewService"

function Interview() {
  const [searchParams] = useSearchParams()
  const jobId = Number(searchParams.get("job"))

  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0)

  const [isStarting, setIsStarting] = useState(false)
  const [submittingId, setSubmittingId] = useState(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [finalResult, setFinalResult] = useState(null)
  const [error, setError] = useState("")

  const currentQuestion =
    questions[currentQuestionIndex] ?? null

  const isLastQuestion =
    currentQuestionIndex === questions.length - 1

  async function handleStart() {
    if (!jobId || isStarting) return

    setError("")
    setIsStarting(true)

    try {
      const data = await startInterview(jobId)

      const sessionData = await getInterviewSession(
        data.session.id,
      )

      setSession(sessionData.session)
      setQuestions(sessionData.questions)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setFinalResult(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsStarting(false)
    }
  }

  async function handleAnswer(questionId) {
    const answer = answers[questionId]?.trim()

    if (!answer || submittingId) return

    setError("")
    setSubmittingId(questionId)

    try {
      const data = await submitInterviewAnswer(
        questionId,
        answer,
      )

      setQuestions((current) =>
        current.map((question) =>
          question.id === questionId
            ? {
                ...question,
                user_answer: answer,
                score: data.evaluation.score,
                ai_feedback: data.evaluation.feedback,
              }
            : question,
        ),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingId(null)
    }
  }

  function handleNextQuestion() {
    if (currentQuestionIndex >= questions.length - 1) {
      return
    }

    setError("")
    setCurrentQuestionIndex(
      (current) => current + 1,
    )
  }

  async function handleComplete() {
    if (!session || isCompleting) return

    setError("")
    setIsCompleting(true)

    try {
      const data = await completeInterview(session.id)
      setFinalResult(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <section className="interview-page">
      <header className="page-intro">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} />
            AI Interview Coach
          </span>

          <h1>Interview Practice</h1>

          <p>
            Practice job-specific interview questions and
            receive AI-powered feedback on every answer.
          </p>
        </div>
      </header>

      {error && (
        <div className="auth-error">{error}</div>
      )}

      {!session && (
        <div className="interview-start">
          {!jobId ? (
            <p>
              Select a job before starting an interview.
            </p>
          ) : (
            <button
              type="button"
              className="primary-action"
              disabled={isStarting}
              onClick={handleStart}
            >
              <Sparkles size={17} />

              {isStarting
                ? "Generating Interview..."
                : "Start AI Interview"}
            </button>
          )}
        </div>
      )}

      {session && !finalResult && currentQuestion && (
        <div className="interview-session">
          <div className="interview-session-header">
            <div>
              <span>
                Question {currentQuestionIndex + 1} of{" "}
                {questions.length}
              </span>

              <h2>{session.title}</h2>
            </div>

            <span className="interview-progress-text">
              {Math.round(
                ((currentQuestionIndex + 1) /
                  questions.length) *
                  100,
              )}
              %
            </span>
          </div>

          <div className="interview-progress">
            <div
              className="interview-progress-bar"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) /
                    questions.length) *
                  100
                }%`,
              }}
            />
          </div>

          <article className="interview-question">
            <span>
              Question {currentQuestionIndex + 1}
            </span>

            <h3>{currentQuestion.question}</h3>

            <textarea
              rows={7}
              value={
                answers[currentQuestion.id] ??
                currentQuestion.user_answer ??
                ""
              }
              disabled={currentQuestion.score !== null}
              placeholder="Write your answer..."
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [currentQuestion.id]:
                    event.target.value,
                }))
              }
            />

            {currentQuestion.score === null && (
              <button
                type="button"
                className="primary-action"
                disabled={
                  submittingId === currentQuestion.id ||
                  !answers[currentQuestion.id]?.trim()
                }
                onClick={() =>
                  handleAnswer(currentQuestion.id)
                }
              >
                <Sparkles size={17} />

                {submittingId === currentQuestion.id
                  ? "AI is Evaluating..."
                  : "Submit Answer"}
              </button>
            )}

            {currentQuestion.score !== null && (
              <div className="interview-feedback">
                <div>
                  <CheckCircle2 size={20} />

                  <strong>
                    Score: {currentQuestion.score}/100
                  </strong>
                </div>

                <p>{currentQuestion.ai_feedback}</p>

                {!isLastQuestion ? (
                  <button
                    type="button"
                    className="primary-action"
                    onClick={handleNextQuestion}
                  >
                    Next Question
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-action"
                    disabled={isCompleting}
                    onClick={handleComplete}
                  >
                    <CheckCircle2 size={17} />

                    {isCompleting
                      ? "Completing Interview..."
                      : "Complete Interview"}
                  </button>
                )}
              </div>
            )}
          </article>
        </div>
      )}

      {finalResult && (
        <div className="interview-final-result">
          <CheckCircle2 size={28} />

          <span>Interview Completed</span>

          <h2>Overall Interview Score</h2>

          <strong>
            {finalResult.overall_score}/100
          </strong>

          <p>{finalResult.feedback_summary}</p>
        </div>
      )}
    </section>
  )
}

export default Interview