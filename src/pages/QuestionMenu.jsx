import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  ListChecks,
  Target,
  ChevronRight,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import * as cdpData from "../data/cdp.js";
import * as teluguData from "../data/telugu.js";
import * as englishData from "../data/english.js";
import * as mathematicsData from "../data/mathematics.js";
import * as evsData from "../data/evs.js";

const TEST_STORAGE_PREFIX = "ap-tet-practice-test-";

const subjects = {
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

function extractQuestions(module) {
  if (Array.isArray(module.default)) {
    return module.default;
  }

  const arrayExport = Object.values(module).find(
    (value) => Array.isArray(value)
  );

  return arrayExport || [];
}

function QuestionMenu() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const subject = subjects[subjectId];

  const [testDialogOpen, setTestDialogOpen] =
    useState(false);

  const [questionCount, setQuestionCount] =
    useState(1);

  const [questionNumber, setQuestionNumber] =
    useState("");

  const [questionError, setQuestionError] =
    useState("");

  const [savedTestCount, setSavedTestCount] =
    useState(0);

  const availableQuestions = useMemo(() => {
    if (!subject) {
      return [];
    }

    return extractQuestions(subject.data).filter(
      (question) =>
        question &&
        question.id &&
        Array.isArray(question.options) &&
        question.options.length >= 4
    );
  }, [subject]);

  /*
   * Open the Practice Test setup dialog.
   *
   * If an unfinished test exists, remember its
   * question count so the dialog can offer Resume.
   */
  const openTestDialog = () => {
    const saved = localStorage.getItem(
      `${TEST_STORAGE_PREFIX}${subjectId}`
    );

    let unfinishedTestCount = 0;

    try {
      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          parsed &&
          !parsed.submitted &&
          Array.isArray(parsed.questions) &&
          parsed.questions.length > 0
        ) {
          unfinishedTestCount =
            parsed.questions.length;
        }
      }
    } catch {
      unfinishedTestCount = 0;
    }

    setSavedTestCount(
      unfinishedTestCount
    );

    const initialCount =
      unfinishedTestCount > 0
        ? unfinishedTestCount
        : Math.min(
            20,
            availableQuestions.length
          );

    setQuestionCount(
      Math.max(
        1,
        Math.min(
          initialCount,
          availableQuestions.length
        )
      )
    );

    setTestDialogOpen(true);
  };

  const closeTestDialog = () => {
    setTestDialogOpen(false);
  };

  /*
   * Start or resume the selected test.
   */
  const startTest = () => {
    if (availableQuestions.length === 0) {
      return;
    }

    const count = Math.max(
      1,
      Math.min(
        Number(questionCount) || 1,
        availableQuestions.length
      )
    );

    setTestDialogOpen(false);

    navigate(
      `/practice-test/${subjectId}?count=${count}`
    );
  };

  /*
   * Delete the unfinished test and start a
   * completely fresh randomized test.
   */
  const startNewTest = () => {
    if (availableQuestions.length === 0) {
      return;
    }

    const count = Math.max(
      1,
      Math.min(
        Number(questionCount) || 1,
        availableQuestions.length
      )
    );

    localStorage.removeItem(
      `${TEST_STORAGE_PREFIX}${subjectId}`
    );

    setSavedTestCount(0);
    setTestDialogOpen(false);

    navigate(
      `/practice-test/${subjectId}?count=${count}`
    );
  };

  /*
   * Open one specific question in All Questions.
   */
  const openIndividualQuestion = () => {
    const number = Number(questionNumber);

    if (!questionNumber.trim()) {
      setQuestionError(
        "Enter a question number."
      );
      return;
    }

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > availableQuestions.length
    ) {
      setQuestionError(
        `Enter a number between 1 and ${availableQuestions.length}.`
      );
      return;
    }

    setQuestionError("");

    navigate(
      `/all-questions/${subjectId}#question-${number}`
    );
  };

  if (!subject) {
    return (
      <main className="question-menu-page">
        <div className="question-menu-container">
          <button
            type="button"
            className="menu-back-button"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={19} />
            Back to Home
          </button>

          <div className="question-menu-empty">
            <h1>Subject not found</h1>

            <p>
              The selected subject does not exist.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const modes = [
    {
      title: "Practice",
      description:
        "Randomized questions with immediate feedback and hints.",
      icon: BookOpen,
      className: "mode-purple",
      action: () =>
        navigate(`/practice/${subjectId}`),
    },

    {
      title: "Practice Test",
      description:
        "Choose the number of questions and take a timed test.",
      icon: Clock3,
      className: "mode-amber",
      action: openTestDialog,
    },

    {
      title: "All Questions",
      description:
        "View every question in original order with immediate checking.",
      icon: ListChecks,
      className: "mode-teal",
      action: () =>
        navigate(
          `/all-questions/${subjectId}`
        ),
    },
  ];

  const numericQuestionCount =
    Number(questionCount) || 0;

  const totalMinutes = Math.floor(
    (numericQuestionCount * 90) / 60
  );

  const totalSeconds =
    (numericQuestionCount * 90) % 60;

  const formattedTime = `${String(
    totalMinutes
  ).padStart(2, "0")}:${String(
    totalSeconds
  ).padStart(2, "0")}`;

  const isResuming =
    savedTestCount > 0 &&
    numericQuestionCount ===
      savedTestCount;

  return (
    <main className="question-menu-page">
      <div className="question-menu-container">

        {/* Header */}

        <header className="question-menu-header">
          <button
            type="button"
            className="menu-back-button"
            onClick={() => navigate("/")}
            aria-label="Back to Home"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="question-menu-subject">
            <div
              className="question-menu-subject-icon"
              style={{
                background:
                  subject.gradient,
              }}
            >
              {subject.shortName}
            </div>

            <div className="question-menu-title">
              <span className="section-kicker">
                Paper 1A
              </span>

              <h1>{subject.name}</h1>

              <p>
                Choose a practice mode or jump to a
                question.
              </p>
            </div>
          </div>
        </header>

        {/* Practice Modes */}

        <section className="question-modes">
          <div className="question-menu-section-heading">
            <span className="section-kicker">
              Practice modes
            </span>

            <h2>
              How do you want to practice?
            </h2>

            <p>
              Select a mode below to begin.
            </p>
          </div>

          <div className="question-mode-list">
            {modes.map((mode) => {
              const Icon = mode.icon;

              return (
                <button
                  type="button"
                  key={mode.title}
                  className={`question-mode-card ${mode.className}`}
                  onClick={mode.action}
                >
                  <div className="mode-icon">
                    <Icon size={21} />
                  </div>

                  <div className="mode-content">
                    <strong>
                      {mode.title}
                    </strong>

                    <span>
                      {mode.description}
                    </span>
                  </div>

                  <ChevronRight
                    className="mode-arrow"
                    size={20}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Individual Question */}

        <section className="question-jump-section">
          <div className="question-menu-section-heading">
            <span className="section-kicker">
              Individual question
            </span>

            <h2>
              Jump to a question
            </h2>

            <p>
              Open a specific question directly.
            </p>
          </div>

          <div className="question-jump-card">

            <div className="question-jump-header">
              <div className="question-jump-icon">
                <Target size={19} />
              </div>

              <div>
                <strong>
                  Question number
                </strong>

                <span>
                  Enter a number from 1 to{" "}
                  {availableQuestions.length}.
                </span>
              </div>
            </div>

            <div className="question-jump-input-row">
              <input
                type="number"
                min="1"
                max={
                  availableQuestions.length || 1
                }
                placeholder="e.g. 127"
                aria-label="Question number"
                className={
                  questionError
                    ? "question-number-input question-input-error"
                    : "question-number-input"
                }
                value={questionNumber}
                onChange={(event) => {
                  setQuestionNumber(
                    event.target.value
                  );

                  setQuestionError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    openIndividualQuestion();
                  }
                }}
              />

              <button
                type="button"
                className="question-jump-button"
                onClick={
                  openIndividualQuestion
                }
                disabled={
                  availableQuestions.length === 0
                }
              >
                Open
                <ChevronRight size={17} />
              </button>
            </div>

            {questionError && (
              <p className="question-jump-error">
                {questionError}
              </p>
            )}
          </div>
        </section>

        {/* Information */}

        <section className="question-menu-note">
          <div className="question-menu-note-icon">
            <BookOpen size={17} />
          </div>

          <p>
            Practice uses randomized questions.
            Practice Tests use randomized questions
            and options. All Questions keeps the
            original question order.
          </p>
        </section>
      </div>

      {/* Practice Test Dialog */}

      {testDialogOpen && (
        <div
          className="test-dialog-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeTestDialog();
            }
          }}
        >
          <div
            className="test-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="test-dialog-title"
          >

            {/* Dialog Header */}

            <div className="test-dialog-header">
              <div>
                <span className="section-kicker">
                  Practice Test
                </span>

                <h2 id="test-dialog-title">
                  {isResuming
                    ? "Resume your test"
                    : "Set up your test"}
                </h2>
              </div>

              <button
                type="button"
                className="test-dialog-close"
                onClick={closeTestDialog}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* Subject */}

            <div className="test-dialog-subject">
              <div
                className="test-dialog-subject-icon"
                style={{
                  background:
                    subject.gradient,
                }}
              >
                {subject.shortName}
              </div>

              <div>
                <strong>
                  {subject.name}
                </strong>

                <span>
                  {availableQuestions.length}{" "}
                  questions available
                </span>
              </div>
            </div>

            {/* Existing Test */}

            {savedTestCount > 0 && (
              <div className="test-dialog-resume-notice">
                <Clock3 size={15} />

                <span>
                  You have an unfinished{" "}
                  <strong>
                    {savedTestCount}-question
                  </strong>{" "}
                  test.
                </span>
              </div>
            )}

            {/* Question Count */}

            <label
              className="test-question-count-label"
              htmlFor="test-question-count"
            >
              Number of questions
            </label>

            <div className="test-question-count-row">
              <input
                id="test-question-count"
                type="number"
                min="1"
                max={
                  availableQuestions.length
                }
                value={questionCount}
                onChange={(event) => {
                  const rawValue =
                    event.target.value;

                  if (rawValue === "") {
                    setQuestionCount("");
                    return;
                  }

                  const value =
                    Number(rawValue);

                  if (
                    Number.isNaN(value)
                  ) {
                    return;
                  }

                  setQuestionCount(
                    Math.max(
                      1,
                      Math.min(
                        value,
                        availableQuestions.length
                      )
                    )
                  );
                }}
              />

              <span>
                / {availableQuestions.length}
              </span>
            </div>

            {/* Test Details */}

            <div className="test-dialog-details">
              <div>
                <span>Questions</span>

                <strong>
                  {numericQuestionCount}
                </strong>
              </div>

              <div>
                <span>Time</span>

                <strong>
                  {formattedTime}
                </strong>
              </div>
            </div>

            {/* Dialog Description */}

            <p className="test-dialog-note">
              {isResuming
                ? `Your ${savedTestCount}-question test will continue from where you left off.`
                : "Each question gets 1:30. Questions and options will be randomized."}
            </p>

            {/* Actions */}

            <div className="test-dialog-actions">

              <button
                type="button"
                className="test-dialog-cancel"
                onClick={closeTestDialog}
              >
                Cancel
              </button>

              {isResuming ? (
                <button
                  type="button"
                  className="test-dialog-start"
                  onClick={startTest}
                >
                  Resume Test
                  <ChevronRight size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  className="test-dialog-start"
                  onClick={startTest}
                  disabled={
                    availableQuestions.length ===
                      0 ||
                    !questionCount
                  }
                >
                  Start Test
                  <ChevronRight size={17} />
                </button>
              )}
            </div>

            {/* New Test */}

            {isResuming && (
              <button
                type="button"
                className="test-dialog-new-test"
                onClick={startNewTest}
              >
                Start a New Test Instead
              </button>
            )}

          </div>
        </div>
      )}
    </main>
  );
}

export default QuestionMenu;