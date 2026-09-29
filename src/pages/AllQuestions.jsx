import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Grid2X2,
  Lightbulb,
  Search,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import * as cdpData from "../data/cdp.js";
import * as teluguData from "../data/telugu.js";
import * as englishData from "../data/english.js";
import * as mathematicsData from "../data/mathematics.js";
import * as evsData from "../data/evs.js";

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

const SETTINGS_KEY = "ap-tet-settings";
const SESSION_HISTORY_KEY = "ap-tet-session-history";

function saveAllQuestionsSession({
  id,
  subjectId,
  startedAt,
  completedAt,
  answers,
  questions,
}) {
  const attempted = Object.keys(answers).length;

  if (!id || !startedAt || attempted === 0) {
    return;
  }

  const correct = questions.filter(
    (question) =>
      answers[question.id] ===
      question.corr_option
  ).length;

  const wrong = attempted - correct;

  const unanswered = Math.max(
    0,
    questions.length - attempted
  );

  const accuracy =
    attempted > 0
      ? Math.round(
          (correct / attempted) * 100
        )
      : 0;

  const durationSeconds = Math.max(
    0,
    Math.round(
      (completedAt - startedAt) / 1000
    )
  );

  const session = {
    id,
    mode: "allQuestions",
    subjectId,
    startedAt,
    completedAt,
    durationSeconds,
    totalQuestions: questions.length,
    attempted,
    correct,
    wrong,
    unanswered,
    accuracy,
  };

  try {
    const saved = localStorage.getItem(
      SESSION_HISTORY_KEY
    );

    const history = saved
      ? JSON.parse(saved)
      : [];

    const safeHistory = Array.isArray(history)
      ? history
      : [];

    const existingIndex =
      safeHistory.findIndex(
        (item) => item?.id === id
      );

    if (existingIndex >= 0) {
      safeHistory[existingIndex] = session;
    } else {
      safeHistory.push(session);
    }

    localStorage.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify(safeHistory)
    );

    window.dispatchEvent(
      new Event(
        "ap-tet-analysis-change"
      )
    );
  } catch {
    // Ignore storage errors so the question page keeps working.
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

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function getLanguage() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return "both";
    }

    const settings = JSON.parse(saved);

    if (
      settings.language === "english" ||
      settings.language === "telugu" ||
      settings.language === "both"
    ) {
      return settings.language;
    }

    return "both";
  } catch {
    return "both";
  }
}

function getOptionText(option, language) {
  if (language === "english") {
    return option.en || option.te || "";
  }

  if (language === "telugu") {
    return option.te || option.en || "";
  }

  return {
    english: option.en || "",
    telugu: option.te || "",
  };
}

function prepareQuestions(subject) {
  const questions = extractQuestions(subject.data).filter(
    (question) =>
      question &&
      question.id &&
      Array.isArray(question.options) &&
      question.options.length >= 4
  );

  /*
   * Question order stays exactly the same
   * as the source data.
   *
   * Only the options are shuffled.
   */
  return questions.map((question) => ({
    ...question,

    shuffledOptionLetters: shuffle(
      question.options
        .slice(0, 4)
        .map((_, index) =>
          String.fromCharCode(65 + index)
        )
    ),
  }));
}


function createAllQuestionsSessionStart(
  existingStartedAt,
  existingSessionId
) {
  if (existingStartedAt && existingSessionId) {
    return {
      startedAt: existingStartedAt,
      sessionId: existingSessionId,
      now: Date.now(),
    };
  }

  const now = Date.now();

  return {
    startedAt: now,
    sessionId: `all-questions-${now}-${Math.random()
      .toString(36)
      .slice(2, 10)}`,
    now,
  };
}

function AllQuestions() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const subject = subjectConfig[subjectId];

  const [language, setLanguage] = useState(getLanguage);

  /*
   * Fresh session every time All Questions is opened.
   *
   * Questions:
   * Original order
   *
   * Options:
   * Shuffled
   */
  const [questions] = useState(() =>
    subject ? prepareQuestions(subject) : []
  );

  const [answers, setAnswers] = useState({});
  const [jumpNumber, setJumpNumber] = useState("");

  const answersRef = useRef({});
  const sessionStartedAtRef = useRef(null);
  const sessionIdRef = useRef(null);

  /*
   * Language changes
   */
  useEffect(() => {
    const updateLanguage = () => {
      setLanguage(getLanguage());
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

  /*
   * Jump directly to a question from the URL hash.
   *
   * Example:
   * /all-questions/cdp#question-127
   */
  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) {
      return;
    }

    const questionId = hash.slice(1);

    const scrollToQuestion = () => {
      const element =
        document.getElementById(questionId);

      if (!element) {
        return;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    const timeoutId = window.setTimeout(
      scrollToQuestion,
      100
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  /*
   * Record the All Questions session when leaving the page.
   *
   * A session starts when the first answer is selected.
   * The same history record is updated as more answers are given.
   */
  useEffect(() => {
    return () => {
      if (
        !sessionStartedAtRef.current ||
        !sessionIdRef.current
      ) {
        return;
      }

      const completedAt = Date.now();

      saveAllQuestionsSession({
        id: sessionIdRef.current,
        subjectId,
        startedAt:
          sessionStartedAtRef.current,
        completedAt,
        answers: answersRef.current,
        questions,
      });
    };
  }, [questions, subjectId]);

  if (!subject) {
    return (
      <main className="all-questions-page">
        <div className="all-questions-container">
          <button
            type="button"
            className="all-questions-back-button"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={19} />
            Back to Home
          </button>

          <div className="all-questions-empty">
            <h1>Subject not found</h1>

            <p>
              The selected subject does not exist.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="all-questions-page">
        <div className="all-questions-container">
          <header className="all-questions-header">
            <button
              type="button"
              className="all-questions-back-button"
              onClick={() =>
                navigate(
                  `/question-menu/${subjectId}`
                )
              }
              aria-label="Back to question menu"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="all-questions-subject">
              <div
                className="all-questions-badge"
                style={{
                  background: subject.gradient,
                }}
              >
                {subject.shortName}
              </div>

              <div>
                <span className="section-kicker">
                  Paper 1A
                </span>

                <h1>{subject.name}</h1>

                <p>All Questions</p>
              </div>
            </div>
          </header>

          <div className="all-questions-empty">
            <Grid2X2 size={30} />

            <h2>
              No questions loaded yet
            </h2>

            <p>
              Add questions to{" "}
              <strong>
                src/data/{subjectId}.js
              </strong>{" "}
              and they will appear here
              automatically.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const answeredCount =
    Object.keys(answers).length;

  const correctCount = questions.filter(
    (question) =>
      answers[question.id] ===
      question.corr_option
  ).length;

  const wrongCount = questions.filter(
    (question) =>
      answers[question.id] &&
      answers[question.id] !==
        question.corr_option
  ).length;

  /*
   * Jump to a specific question.
   */
  const jumpToQuestion = () => {
    const number = Number(jumpNumber);

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > questions.length
    ) {
      return;
    }

    const element = document.getElementById(
      `question-${number}`
    );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.replaceState(
      null,
      "",
      `#question-${number}`
    );
  };

  const selectOption = (
    questionId,
    letter
  ) => {
    if (answers[questionId]) {
      return;
    }

    const sessionStart =
      createAllQuestionsSessionStart(
        sessionStartedAtRef.current,
        sessionIdRef.current
      );

    sessionStartedAtRef.current =
      sessionStart.startedAt;

    sessionIdRef.current =
      sessionStart.sessionId;

    const now = sessionStart.now;

    const nextAnswers = {
      ...answersRef.current,
      [questionId]: letter,
    };

    answersRef.current = nextAnswers;

    setAnswers(nextAnswers);

    saveAllQuestionsSession({
      id: sessionIdRef.current,
      subjectId,
      startedAt:
        sessionStartedAtRef.current,
      completedAt: now,
      answers: nextAnswers,
      questions,
    });
  };

  return (
    <main className="all-questions-page">
      <div className="all-questions-container">
        {/* Header */}

        <header className="all-questions-header">
          <button
            type="button"
            className="all-questions-back-button"
            onClick={() =>
              navigate(
                `/question-menu/${subjectId}`
              )
            }
            aria-label="Back to question menu"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="all-questions-subject">
            <div
              className="all-questions-badge"
              style={{
                background: subject.gradient,
              }}
            >
              {subject.shortName}
            </div>

            <div>
              <span className="section-kicker">
                Paper 1A
              </span>

              <h1>{subject.name}</h1>

              <p>
                All Questions · Original order
              </p>
            </div>
          </div>
        </header>

        {/* Jump to Question */}

        <div className="all-questions-jump">
          <div className="all-questions-jump-icon">
            <Search size={17} />
          </div>

          <input
            type="number"
            min="1"
            max={questions.length}
            placeholder="Question number"
            value={jumpNumber}
            onChange={(event) =>
              setJumpNumber(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                jumpToQuestion();
              }
            }}
            aria-label="Jump to question"
          />

          <button
            type="button"
            onClick={jumpToQuestion}
          >
            Go
          </button>
        </div>

        {/* Progress */}

        <section className="all-questions-progress">
          <div className="all-questions-progress-top">
            <div>
              <span className="section-kicker">
                Progress
              </span>

              <strong>
                {answeredCount} /{" "}
                {questions.length}
              </strong>
            </div>

            <div className="all-questions-progress-results">
              <span className="all-correct">
                ✓ {correctCount}
              </span>

              <span className="all-wrong">
                ✕ {wrongCount}
              </span>
            </div>
          </div>

          <div className="all-questions-progress-track">
            <div
              className="all-questions-progress-bar"
              style={{
                width: `${
                  (answeredCount /
                    questions.length) *
                  100
                }%`,
              }}
            />
          </div>
        </section>

        {/* Questions */}

        <section className="all-questions-list">
          {questions.map(
            (question, index) => {
              const selectedOption =
                answers[question.id] ||
                null;

              const isAnswered =
                Boolean(selectedOption);

              const isCorrect =
                isAnswered &&
                selectedOption ===
                  question.corr_option;

              const orderedOptions =
                question.shuffledOptionLetters
                  .map((letter) => {
                    const optionIndex =
                      letter.charCodeAt(0) -
                      65;

                    const option =
                      question.options[
                        optionIndex
                      ];

                    if (!option) {
                      return null;
                    }

                    return {
                      letter,
                      option,
                    };
                  })
                  .filter(Boolean);

              return (
                <article
                  className="all-question-card"
                  key={question.id}
                  id={`question-${index + 1}`}
                >
                  {/* Question header */}

                  <div className="all-question-header">
                    <div className="all-question-number">
                      {index + 1}
                    </div>

                    <span>
                      Question {index + 1}
                    </span>

                    {isAnswered &&
                      (isCorrect ? (
                        <CheckCircle2
                          className="all-question-result-icon correct"
                          size={19}
                        />
                      ) : (
                        <XCircle
                          className="all-question-result-icon wrong"
                          size={19}
                        />
                      ))}
                  </div>

                  {/* Question text */}

                  <div className="all-question-text">
                    {language ===
                      "english" &&
                      question.engq && (
                        <p>
                          {question.engq}
                        </p>
                      )}

                    {language ===
                      "telugu" &&
                      question.telq && (
                        <p>
                          {question.telq}
                        </p>
                      )}

                    {language === "both" && (
                      <>
                        {question.engq && (
                          <p>
                            {question.engq}
                          </p>
                        )}

                        {question.telq && (
                          <p className="telugu-question">
                            {question.telq}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Options */}

                  <div className="all-question-options">
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
                          question.corr_option;

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
                        }

                        return (
                          <button
                            type="button"
                            key={letter}
                            className={`all-question-option ${optionClass}`}
                            onClick={() =>
                              selectOption(
                                question.id,
                                letter
                              )
                            }
                            disabled={
                              isAnswered
                            }
                          >
                            <span className="all-option-letter">
                              {letter}
                            </span>

                            <span className="all-option-text">
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

                  {/* Result */}

                  {isAnswered && (
                    <div
                      className={`all-question-result ${
                        isCorrect
                          ? "correct"
                          : "wrong"
                      }`}
                    >
                      <strong>
                        {isCorrect
                          ? "Correct answer"
                          : "Wrong answer"}
                      </strong>

                      <span>
                        Correct option:{" "}
                        {question.corr_option}
                      </span>
                    </div>
                  )}

                  {/* Hint */}

                  {isAnswered &&
                    question.hint && (
                      <div className="all-question-hint">
                        <div className="all-question-hint-icon">
                          <Lightbulb size={16} />
                        </div>

                        <div>
                          <strong>
                            Hint
                          </strong>

                          <p>
                            {question.hint}
                          </p>
                        </div>
                      </div>
                    )}
                </article>
              );
            }
          )}
        </section>

        {/* Bottom */}

        <button
          type="button"
          className="all-questions-back-menu"
          onClick={() =>
            navigate(
              `/question-menu/${subjectId}`
            )
          }
        >
          <ArrowLeft size={17} />
          Back to Question Menu
        </button>
      </div>
    </main>
  );
}

export default AllQuestions;