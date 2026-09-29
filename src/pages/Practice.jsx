import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Lightbulb,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import * as cdpData from "../data/cdp.js";
import * as teluguData from "../data/telugu.js";
import * as englishData from "../data/english.js";
import * as mathematicsData from "../data/mathematics.js";
import * as evsData from "../data/evs.js";

const SETTINGS_KEY = "ap-tet-settings";
const SESSION_HISTORY_KEY = "ap-tet-session-history";

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

/* ========================================
   DATA HELPERS
   ======================================== */

function savePracticeSession({
  subjectId,
  questions,
  answers,
  startedAt,
  completedAt,
}) {
  try {
    const previous = localStorage.getItem(
      SESSION_HISTORY_KEY
    );

    const history = previous
      ? JSON.parse(previous)
      : [];

    if (!Array.isArray(history)) {
      return;
    }

    const attempted =
      Object.keys(answers).length;

    const correct = questions.filter(
      (question) =>
        answers[question.id] ===
        question.corr_option
    ).length;

    const wrong =
      Math.max(0, attempted - correct);

    const unanswered = Math.max(
      0,
      questions.length - attempted
    );

    const durationSeconds = Math.max(
      0,
      Math.floor(
        (completedAt - startedAt) / 1000
      )
    );

    const session = {
      id: `practice-${completedAt}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      mode: "practice",
      subjectId,
      startedAt,
      completedAt,
      durationSeconds,
      totalQuestions: questions.length,
      attempted,
      correct,
      wrong,
      unanswered,
      accuracy:
        attempted > 0
          ? Math.round(
              (correct / attempted) * 100
            )
          : 0,
    };

    const updatedHistory = [
      session,
      ...history,
    ].slice(0, 500);

    localStorage.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify(updatedHistory)
    );

    window.dispatchEvent(
      new Event("ap-tet-analysis-change")
    );
  } catch {
    // Keep practice usable if history storage fails.
  }
}

function extractQuestions(module) {
  if (Array.isArray(module.default)) {
    return module.default;
  }

  const arrayExport = Object.values(module).find(
    (value) => Array.isArray(value)
  );

  return arrayExport || [];
}

function shuffle(array) {
  const result = [...array];

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

function getLanguage() {
  try {
    const saved =
      localStorage.getItem(
        SETTINGS_KEY
      );

    if (!saved) {
      return "both";
    }

    const parsed =
      JSON.parse(saved);

    if (
      parsed.language === "english" ||
      parsed.language === "telugu" ||
      parsed.language === "both"
    ) {
      return parsed.language;
    }

    return "both";
  } catch {
    return "both";
  }
}

function getOptionText(
  option,
  language
) {
  if (
    language === "english"
  ) {
    return (
      option.en ||
      option.te ||
      ""
    );
  }

  if (
    language === "telugu"
  ) {
    return (
      option.te ||
      option.en ||
      ""
    );
  }

  return {
    english:
      option.en || "",
    telugu:
      option.te || "",
  };
}

/* ========================================
   PREPARE FRESH PRACTICE SESSION
   ======================================== */

function prepareQuestions(
  subject
) {
  const questions =
    extractQuestions(
      subject.data
    ).filter(
      (question) =>
        question &&
        question.id &&
        Array.isArray(
          question.options
        ) &&
        question.options.length >= 4
    );

  /*
   * Practice mode:
   *
   * Question order = randomized
   * Option order   = randomized
   */
  return shuffle(
    questions
  ).map(
    (question) => ({
      ...question,

      shuffledOptionLetters:
        shuffle(
          question.options
            .slice(0, 4)
            .map(
              (_, index) =>
                String.fromCharCode(
                  65 + index
                )
            )
        ),
    })
  );
}

/* ========================================
   PRACTICE
   ======================================== */

function Practice() {
  const navigate =
    useNavigate();

  const {
    subjectId,
  } = useParams();

  const subject =
    subjectConfig[
      subjectId
    ];

  const [language, setLanguage] =
    useState(
      getLanguage
    );

  /*
   * Fresh session every time this page
   * is mounted.
   *
   * Nothing is stored in localStorage.
   */
  const [questions] =
    useState(() =>
      subject
        ? prepareQuestions(
            subject
          )
        : []
    );

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    answers,
    setAnswers,
  ] = useState({});

  const [
    jumpMenuOpen,
    setJumpMenuOpen,
  ] = useState(false);

  const sessionStartedAtRef = useRef(null);

  const sessionRecordedRef = useRef(false);

  /*
   * Record the session start time without putting it into
   * React state. This avoids an effect-driven setState.
   */
  useEffect(() => {
    sessionStartedAtRef.current = Date.now();
    sessionRecordedRef.current = false;
  }, [subjectId]);

  /* ======================================
     LANGUAGE CHANGE
     ====================================== */

  useEffect(() => {
    const updateLanguage =
      () => {
        setLanguage(
          getLanguage()
        );
      };

    window.addEventListener(
      "ap-tet-language-change",
      updateLanguage
    );

    return () => {
      window.removeEventListener(
        "ap-tet-language-change",
        updateLanguage
      );
    };
  }, []);

  /* ======================================
     INVALID SUBJECT
     ====================================== */

  if (!subject) {
    return (
      <main className="practice-page">
        <div className="practice-container">

          <button
            type="button"
            className="practice-back-button"
            onClick={() =>
              navigate("/")
            }
          >
            <ArrowLeft
              size={19}
            />
            Back to Home
          </button>

          <div className="practice-empty">

            <h1>
              Subject not found
            </h1>

            <p>
              The selected subject
              does not exist.
            </p>

          </div>

        </div>
      </main>
    );
  }

  /* ======================================
     NO QUESTIONS
     ====================================== */

  if (
    questions.length === 0
  ) {
    return (
      <main className="practice-page">
        <div className="practice-container">

          <header className="practice-header">

            <button
              type="button"
              className="practice-back-button"
              onClick={() =>
                navigate(
                  `/question-menu/${subjectId}`
                )
              }
              aria-label="Back to question menu"
            >
              <ArrowLeft
                size={19}
              />
            </button>

            <div className="practice-header-subject">

              <div
                className="practice-subject-badge"
                style={{
                  background:
                    subject.gradient,
                }}
              >
                {
                  subject.shortName
                }
              </div>

              <div>

                <span className="section-kicker">
                  Paper 1A
                </span>

                <h1>
                  {subject.name}
                </h1>

                <p>
                  Practice
                </p>

              </div>

            </div>

          </header>

          <div className="practice-empty">

            <Lightbulb
              size={28}
            />

            <h2>
              No questions loaded yet
            </h2>

            <p>
              Add the real questions
              to{" "}
              <strong>
                src/data/
                {subjectId}.js
              </strong>{" "}
              and they will appear
              here automatically.
            </p>

          </div>

        </div>
      </main>
    );
  }

  /* ======================================
     CURRENT QUESTION
     ====================================== */

  const safeCurrentIndex =
    Math.min(
      Math.max(
        currentIndex,
        0
      ),
      questions.length - 1
    );

  const currentQuestion =
    questions[
      safeCurrentIndex
    ];

  const selectedOption =
    answers[
      currentQuestion.id
    ] || null;

  const isAnswered =
    Boolean(
      selectedOption
    );

  const isCorrect =
    isAnswered &&
    selectedOption ===
      currentQuestion.corr_option;

  const answeredCount =
    Object.keys(
      answers
    ).length;

  /* ======================================
     ORDER OPTIONS
     ====================================== */

  const orderedOptions =
    currentQuestion
      .shuffledOptionLetters
      .map(
        (letter) => {
          const optionIndex =
            letter.charCodeAt(
              0
            ) - 65;

          const option =
            currentQuestion
              .options[
              optionIndex
            ];

          if (!option) {
            return null;
          }

          return {
            letter,
            option,
          };
        }
      )
      .filter(Boolean);

  /* ======================================
     SELECT OPTION
     ====================================== */

  const selectOption =
    (letter) => {
      if (isAnswered) {
        return;
      }

      setAnswers(
        (current) => ({
          ...current,

          [currentQuestion.id]:
            letter,
        })
      );
    };

  /* ======================================
     EXIT PRACTICE
     ====================================== */

  const exitPractice = () => {
    if (!sessionRecordedRef.current) {
      const completedAt = Date.now();
      const startedAt =
        sessionStartedAtRef.current ||
        completedAt;

      savePracticeSession({
        subjectId,
        questions,
        answers,
        startedAt,
        completedAt,
      });

      sessionRecordedRef.current = true;
    }

    navigate(
      `/question-menu/${subjectId}`
    );
  };

  /* ======================================
     GO TO QUESTION
     ====================================== */

  const goToQuestion =
    (index) => {
      if (
        index < 0 ||
        index >=
          questions.length
      ) {
        return;
      }

      setCurrentIndex(
        index
      );

      setJumpMenuOpen(
        false
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /* ======================================
     QUESTION STATE
     ====================================== */

  const getQuestionState =
    (question) => {
      const answer =
        answers[
          question.id
        ];

      if (!answer) {
        return "unanswered";
      }

      return answer ===
        question.corr_option
        ? "correct"
        : "wrong";
    };

  return (
    <main className="practice-page">
      <div className="practice-container">

        {/* ==================================
            HEADER
            ================================== */}

        <header className="practice-header">

          <button
            type="button"
            className="practice-back-button"
            onClick={exitPractice}
            aria-label="Exit practice"
          >
            <ArrowLeft
              size={19}
            />
          </button>

          <div className="practice-header-subject">

            <div
              className="practice-subject-badge"
              style={{
                background:
                  subject.gradient,
              }}
            >
              {
                subject.shortName
              }
            </div>

            <div>

              <span className="section-kicker">
                Paper 1A
              </span>

              <h1>
                {subject.name}
              </h1>

              <p>
                {answeredCount} /{" "}
                {
                  questions.length
                }{" "}
                answered
              </p>

            </div>

          </div>

          <button
            type="button"
            className="practice-icon-button"
            aria-label="Open question navigator"
            onClick={() =>
              setJumpMenuOpen(
                (open) => !open
              )
            }
          >
            <Grid2X2
              size={18}
            />
          </button>

        </header>

        {/* ==================================
            PROGRESS
            ================================== */}

        <div className="practice-progress-line">

          <span>
            {answeredCount} /{" "}
            {questions.length}{" "}
            answered
          </span>

          <span>
            Question{" "}
            {safeCurrentIndex + 1}
          </span>

        </div>

        {/* ==================================
            QUESTION CARD
            ================================== */}

        <section className="practice-question-card">

          <div className="practice-question-number">
            {safeCurrentIndex + 1}
          </div>

          <div className="practice-question-body">

            {/* Question text */}

            <div className="practice-question-text">

              {language ===
                "english" &&
                currentQuestion.engq && (
                  <p>
                    {
                      currentQuestion.engq
                    }
                  </p>
                )}

              {language ===
                "telugu" &&
                currentQuestion.telq && (
                  <p>
                    {
                      currentQuestion.telq
                    }
                  </p>
                )}

              {language ===
                "both" && (
                <>
                  {currentQuestion.engq && (
                    <p>
                      {
                        currentQuestion.engq
                      }
                    </p>
                  )}

                  {currentQuestion.telq && (
                    <p className="telugu-question">
                      {
                        currentQuestion.telq
                      }
                    </p>
                  )}
                </>
              )}

            </div>

            {/* Options */}

            <div className="practice-options">

              {orderedOptions.map(
                ({
                  letter,
                  option,
                }) => {

                  const text =
                    getOptionText(
                      option,
                      language
                    );

                  const isSelected =
                    selectedOption ===
                    letter;

                  const isCorrectOption =
                    letter ===
                    currentQuestion.corr_option;

                  let optionClass =
                    "";

                  if (
                    isAnswered &&
                    isCorrectOption
                  ) {
                    optionClass =
                      "correct";
                  } else if (
                    isAnswered &&
                    isSelected
                  ) {
                    optionClass =
                      "wrong";
                  } else if (
                    isSelected
                  ) {
                    optionClass =
                      "selected";
                  }

                  return (
                    <button
                      type="button"
                      key={letter}
                      className={`practice-option ${optionClass}`}
                      onClick={() =>
                        selectOption(
                          letter
                        )
                      }
                      disabled={
                        isAnswered
                      }
                    >

                      <span className="practice-option-number">
                        {letter}
                      </span>

                      <span className="practice-option-text">

                        {typeof text ===
                        "string" ? (
                          text
                        ) : (
                          <>
                            {text.english && (
                              <span>
                                {
                                  text.english
                                }
                              </span>
                            )}

                            {text.telugu && (
                              <span className="telugu-option">
                                {
                                  text.telugu
                                }
                              </span>
                            )}
                          </>
                        )}

                      </span>

                      {isAnswered &&
                        isCorrectOption && (
                          <CheckCircle2
                            size={17}
                          />
                        )}

                      {isAnswered &&
                        isSelected &&
                        !isCorrectOption && (
                          <XCircle
                            size={17}
                          />
                        )}

                    </button>
                  );
                }
              )}

            </div>

            {/* Answer result */}

            {isAnswered && (
              <div
                className={`practice-answer ${
                  isCorrect
                    ? "answer-correct"
                    : "answer-wrong"
                }`}
              >

                <strong>
                  {isCorrect
                    ? "Correct answer"
                    : "Wrong answer"}
                </strong>

                <span>
                  Correct option:{" "}
                  {
                    currentQuestion.corr_option
                  }
                </span>

              </div>
            )}

            {/* Hint */}

            {isAnswered &&
              currentQuestion.hint && (
                <div className="practice-hint">

                  <div className="practice-hint-icon">
                    <Lightbulb
                      size={18}
                    />
                  </div>

                  <div>

                    <strong>
                      Hint
                    </strong>

                    <p>
                      {
                        currentQuestion.hint
                      }
                    </p>

                  </div>

                </div>
              )}

          </div>

        </section>

        {/* ==================================
            NAVIGATION
            ================================== */}

        <nav className="practice-navigation">

          <button
            type="button"
            className="practice-nav-button"
            disabled={
              safeCurrentIndex ===
              0
            }
            onClick={() =>
              goToQuestion(
                safeCurrentIndex -
                  1
              )
            }
          >
            <ChevronLeft
              size={18}
            />

            Previous
          </button>

          <div className="practice-current-number">
            {safeCurrentIndex + 1}
          </div>

          <button
            type="button"
            className="practice-nav-button"
            disabled={
              safeCurrentIndex ===
              questions.length - 1
            }
            onClick={() =>
              goToQuestion(
                safeCurrentIndex +
                  1
              )
            }
          >
            Next

            <ChevronRight
              size={18}
            />
          </button>

        </nav>

        {/* ==================================
            JUMP MENU
            ================================== */}

        {jumpMenuOpen && (
          <section
            className="practice-jump-menu"
            id="practice-question-jump-menu"
          >

            <div className="practice-jump-menu-header">

              <strong>
                Jump to question
              </strong>

              <span>
                {answeredCount}{" "}
                answered
              </span>

            </div>

            <div className="practice-jump-grid">

              {questions.map(
                (
                  question,
                  index
                ) => {

                  const state =
                    getQuestionState(
                      question
                    );

                  const isCurrent =
                    index ===
                    safeCurrentIndex;

                  return (
                    <button
                      type="button"
                      key={
                        question.id
                      }
                      className={`
                        practice-jump-number
                        ${state}
                        ${
                          isCurrent
                            ? "current"
                            : ""
                        }
                      `}
                      onClick={() =>
                        goToQuestion(
                          index
                        )
                      }
                    >
                      {index + 1}
                    </button>
                  );
                }
              )}

            </div>

            <div className="practice-jump-legend">

              <span>
                <i className="jump-current" />
                Current
              </span>

              <span>
                <i className="jump-correct" />
                Correct
              </span>

              <span>
                <i className="jump-wrong" />
                Wrong
              </span>

              <span>
                <i className="jump-unanswered" />
                Unanswered
              </span>

            </div>

          </section>
        )}

      </div>
    </main>
  );
}

export default Practice;