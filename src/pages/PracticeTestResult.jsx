import { useEffect, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  Home,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import * as cdpData from "../data/cdp.js";
import * as teluguData from "../data/telugu.js";
import * as englishData from "../data/english.js";
import * as mathematicsData from "../data/mathematics.js";
import * as evsData from "../data/evs.js";

const ANALYSIS_STORAGE_KEY = "ap-tet-analysis";
const TEST_STORAGE_PREFIX =
  "ap-tet-practice-test-";

const subjectConfig = {
  cdp: {
    name: "Child Development & Pedagogy",
    shortName: "CDP",
    gradient: "var(--gradient-purple)",
    data: cdpData,
  },

  telugu: {
    name: "Telugu",
    shortName: "తెలుగు",
    gradient: "var(--gradient-coral)",
    data: teluguData,
  },

  english: {
    name: "English",
    shortName: "English",
    gradient: "var(--gradient-teal)",
    data: englishData,
  },

  mathematics: {
    name: "Mathematics",
    shortName: "Maths",
    gradient: "var(--gradient-amber)",
    data: mathematicsData,
  },

  evs: {
    name: "Environmental Studies",
    shortName: "EVS",
    gradient: "var(--gradient-purple)",
    data: evsData,
  },
};

function saveAnalysis(result) {
  try {
    const saved = localStorage.getItem(
      ANALYSIS_STORAGE_KEY
    );

    const previous = saved
      ? JSON.parse(saved)
      : {};

    const completedTests = Array.isArray(
      previous.completedTests
    )
      ? previous.completedTests
      : [];

    /*
     * Prevent the same test from being counted
     * more than once.
     */
    if (
      completedTests.includes(
        result.testId
      )
    ) {
      return;
    }

    const updated = {
      testsTaken:
        Number(previous.testsTaken) || 0,

      correct:
        Number(previous.correct) || 0,

      wrong:
        Number(previous.wrong) || 0,

      totalDone:
        Number(previous.totalDone) || 0,

      completedTests: [
        ...completedTests,
        result.testId,
      ],

      lastSubject: result.subjectId,

      lastCompletedAt:
        result.completedAt,
    };

    updated.testsTaken += 1;
    updated.correct += result.correct;
    updated.wrong += result.wrong;
    updated.totalDone += result.total;

    localStorage.setItem(
      ANALYSIS_STORAGE_KEY,
      JSON.stringify(updated)
    );
  } catch {
    /*
     * Keep the result page usable even if
     * localStorage is unavailable.
     */
  }
}

function PracticeTestResult() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const subject =
    subjectConfig[subjectId];

  const test = useMemo(() => {
    try {
      const saved =
        localStorage.getItem(
          `${TEST_STORAGE_PREFIX}${subjectId}`
        );

      if (!saved) {
        return null;
      }

      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, [subjectId]);

  /*
   * Calculate result data without performing
   * any side effects during render.
   */
  const result = useMemo(() => {
    if (
      !test ||
      !test.submitted ||
      !Array.isArray(test.questions)
    ) {
      return null;
    }

    const questions = test.questions;

    const answers =
      test.answers &&
      typeof test.answers === "object"
        ? test.answers
        : {};

    const total =
      questions.length;

    const attempted =
      questions.filter(
        (question) =>
          answers[question.id]
      ).length;

    const correct =
      questions.filter(
        (question) =>
          answers[question.id] ===
          question.corr_option
      ).length;

    const wrong =
      attempted - correct;

    const unanswered =
      total - attempted;

    const percentage =
      total > 0
        ? Math.round(
            (correct / total) * 100
          )
        : 0;

    /*
     * Use stored timestamps only.
     * No Date.now() during render.
     */
    const testId =
      test.testId ||
      `${subjectId}-${test.startedAt}`;

    const completedAt =
      Number(test.submittedAt) || 0;

    return {
      questions,
      answers,
      total,
      attempted,
      correct,
      wrong,
      unanswered,
      percentage,
      testId,
      completedAt,
    };
  }, [test, subjectId]);

  /*
   * Save analysis after render.
   *
   * localStorage is an external system, so this
   * belongs inside an effect.
   */
  useEffect(() => {
    if (!result) {
      return;
    }

    saveAnalysis({
      testId: result.testId,
      subjectId,
      correct: result.correct,
      wrong: result.wrong,
      total: result.total,
      completedAt: result.completedAt,
    });
  }, [result, subjectId]);

  /*
   * Invalid subject.
   */
  if (!subject) {
    return (
      <main className="result-page">
        <div className="result-container">
          <h1>
            Subject not found
          </h1>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  /*
   * No valid submitted test.
   */
  if (!result) {
    return (
      <main className="result-page">
        <div className="result-container">
          <button
            type="button"
            className="result-back-button"
            onClick={() =>
              navigate(
                `/question-menu/${subjectId}`
              )
            }
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="result-empty">
            <MinusCircle size={30} />

            <h1>
              No submitted test
            </h1>

            <p>
              Complete and submit a Practice Test
              to view its results.
            </p>

            <button
              type="button"
              className="result-primary-button"
              onClick={() =>
                navigate(
                  `/practice-test/${subjectId}`
                )
              }
            >
              Start Test
            </button>
          </div>
        </div>
      </main>
    );
  }

  const restartTest = () => {
    localStorage.removeItem(
      `${TEST_STORAGE_PREFIX}${subjectId}`
    );

    navigate(
      `/practice-test/${subjectId}`
    );
  };

  const goHome = () => {
    navigate("/");
  };

  return (
    <main className="result-page">
      <div className="result-container">

        {/* Header */}

        <header className="result-header">
          <button
            type="button"
            className="result-back-button"
            onClick={goHome}
            aria-label="Back to home"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="result-subject">
            <div
              className="result-subject-badge"
              style={{
                background:
                  subject.gradient,
              }}
            >
              {subject.shortName}
            </div>

            <div>
              <span className="section-kicker">
                Practice Test Result
              </span>

              <h1>
                {subject.name}
              </h1>
            </div>
          </div>
        </header>

        {/* Score */}

        <section className="result-score-card">
          <span className="section-kicker">
            Your score
          </span>

          <div className="result-score">
            <strong>
              {result.correct}
            </strong>

            <span>
              / {result.total}
            </span>
          </div>

          <div className="result-percentage">
            {result.percentage}%
          </div>

          <p>
            You attempted{" "}
            {result.attempted} out of{" "}
            {result.total} questions.
          </p>
        </section>

        {/* Statistics */}

        <section className="result-stat-grid">

          <div className="result-stat correct">
            <CheckCircle2 size={19} />

            <span>
              Correct
            </span>

            <strong>
              {result.correct}
            </strong>
          </div>

          <div className="result-stat wrong">
            <XCircle size={19} />

            <span>
              Wrong
            </span>

            <strong>
              {result.wrong}
            </strong>
          </div>

          <div className="result-stat unanswered">
            <MinusCircle size={19} />

            <span>
              Unanswered
            </span>

            <strong>
              {result.unanswered}
            </strong>
          </div>

        </section>

        {/* Actions */}

        <section className="result-actions">

          <button
            type="button"
            className="result-primary-button"
            onClick={restartTest}
          >
            <RotateCcw size={17} />
            Take Test Again
          </button>

          <button
            type="button"
            className="result-secondary-button"
            onClick={goHome}
          >
            <Home size={17} />
            Back to Home
          </button>

        </section>

        {/* Question Review */}

        <section className="result-review">

          <div className="result-review-header">
            <div>
              <span className="section-kicker">
                Review
              </span>

              <h2>
                Question breakdown
              </h2>
            </div>

            <span>
              {result.correct}/
              {result.total} correct
            </span>
          </div>

          <div className="result-question-list">
            {result.questions.map(
              (
                question,
                index
              ) => {
                const selected =
                  result.answers[
                    question.id
                  ] || null;

                const isCorrect =
                  selected ===
                  question.corr_option;

                return (
                  <div
                    key={question.id}
                    className="result-question"
                  >
                    <div
                      className={
                        isCorrect
                          ? "result-question-number correct"
                          : selected
                            ? "result-question-number wrong"
                            : "result-question-number unanswered"
                      }
                    >
                      {index + 1}
                    </div>

                    <div className="result-question-info">
                      <strong>
                        Question{" "}
                        {index + 1}
                      </strong>

                      <span>
                        {selected
                          ? `Your answer: ${selected}`
                          : "Not answered"}
                      </span>
                    </div>

                    <div className="result-question-answer">
                      <span>
                        Correct
                      </span>

                      <strong>
                        {
                          question.corr_option
                        }
                      </strong>
                    </div>
                  </div>
                );
              }
            )}
          </div>

        </section>
      </div>
    </main>
  );
}

export default PracticeTestResult;