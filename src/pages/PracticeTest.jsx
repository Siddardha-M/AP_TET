import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Send,
  Grid2X2,
  ChevronDown,
} from "lucide-react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import * as cdpData from "../data/cdp.js";
import * as teluguData from "../data/telugu.js";
import * as englishData from "../data/english.js";
import * as mathematicsData from "../data/mathematics.js";
import * as evsData from "../data/evs.js";

const TEST_STORAGE_PREFIX =
  "ap-tet-practice-test-";

const SESSION_HISTORY_KEY =
  "ap-tet-session-history";

const SETTINGS_KEY =
  "ap-tet-settings";

const SECONDS_PER_QUESTION = 90;

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

function extractQuestions(module) {
  if (Array.isArray(module.default)) {
    return module.default;
  }

  const arrayExport = Object.values(
    module
  ).find(
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
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1)
      );

    [result[index], result[randomIndex]] =
      [
        result[randomIndex],
        result[index],
      ];
  }

  return result;
}

function getAvailableQuestions(
  subject
) {
  return extractQuestions(
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

    const settings =
      JSON.parse(saved);

    if (
      settings.language ===
        "english" ||
      settings.language ===
        "telugu" ||
      settings.language ===
        "both"
    ) {
      return settings.language;
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
   SESSION HISTORY
   ======================================== */

function getSessionHistory() {
  try {
    const saved = localStorage.getItem(
      SESSION_HISTORY_KEY
    );

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function getSafeAnswerCount(test) {
  if (!test || !test.answers) {
    return 0;
  }

  return Object.keys(test.answers).length;
}

function buildCompletedSession(
  test,
  subjectId
) {
  const questions = Array.isArray(
    test?.questions
  )
    ? test.questions
    : [];

  const answers =
    test?.answers &&
    typeof test.answers === "object"
      ? test.answers
      : {};

  const attempted = Object.keys(
    answers
  ).length;

  const correct = questions.filter(
    (question) =>
      answers[question.id] ===
      question.corr_option
  ).length;

  const wrong = questions.filter(
    (question) =>
      answers[question.id] &&
      answers[question.id] !==
        question.corr_option
  ).length;

  const unanswered = Math.max(
    0,
    questions.length - attempted
  );

  const startedAt = Number(
    test?.startedAt
  ) || 0;

  const completedAt = Number(
    test?.submittedAt
  ) || Date.now();

  const durationSeconds =
    startedAt > 0
      ? Math.max(
          0,
          Math.floor(
            (completedAt - startedAt) /
              1000
          )
        )
      : 0;

  const accuracy =
    attempted > 0
      ? Math.round(
          (correct / attempted) * 100
        )
      : 0;

  return {
    id: test?.testId,
    mode: "practiceTest",
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
}

function recordCompletedTest(
  test,
  subjectId
) {
  if (!test?.testId || !test?.submitted) {
    return false;
  }

  try {
    const history = getSessionHistory();

    const alreadyRecorded = history.some(
      (session) =>
        session?.id === test.testId
    );

    if (alreadyRecorded) {
      return false;
    }

    const session =
      buildCompletedSession(
        test,
        subjectId
      );

    const nextHistory = [
      session,
      ...history,
    ];

    localStorage.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify(nextHistory)
    );

    window.dispatchEvent(
      new Event(
        "ap-tet-analysis-change"
      )
    );

    return true;
  } catch {
    return false;
  }
}

/* ========================================
   TEST PREPARATION
   ======================================== */

function prepareTestQuestions(
  subject,
  count
) {
  const availableQuestions =
    getAvailableQuestions(
      subject
    );

  return shuffle(
    availableQuestions
  )
    .slice(0, count)
    .map(
      (question) => ({
        id: question.id,

        engq:
          question.engq || "",

        telq:
          question.telq || "",

        options:
          question.options,

        corr_option:
          question.corr_option,

        hint:
          question.hint || "",

        Explanation:
          question.Explanation ||
          "",

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
   CREATE TEST
   ======================================== */

function createTest(
  subject,
  questionCount
) {
  const questions =
    prepareTestQuestions(
      subject,
      questionCount
    );

  const startedAt =
    Date.now();

  const endAt =
    startedAt +
    questions.length *
      SECONDS_PER_QUESTION *
      1000;

  return {
    testId:
      `${subject.shortName}-${startedAt}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    questions,

    answers: {},

    currentIndex: 0,

    startedAt,

    endAt,

    remainingSeconds:
      questions.length *
      SECONDS_PER_QUESTION,

    submitted: false,

    submittedAt: null,
  };
}

/* ========================================
   LOAD TEST
   ======================================== */

function loadSavedTest(
  subjectId,
  subject,
  questionCount,
  forceNew
) {
  const storageKey =
    `${TEST_STORAGE_PREFIX}${subjectId}`;

  /*
   * Force a completely new test.
   */
  if (forceNew) {
    return createTest(
      subject,
      questionCount
    );
  }

  try {
    const saved =
      localStorage.getItem(
        storageKey
      );

    /*
     * No previous test.
     */
    if (!saved) {
      return createTest(
        subject,
        questionCount
      );
    }

    const parsed =
      JSON.parse(saved);

    /*
     * Invalid saved test.
     */
    if (
      !parsed ||
      parsed.submitted ||
      !Array.isArray(
        parsed.questions
      ) ||
      parsed.questions.length ===
        0 ||
      parsed.questions.length !==
        questionCount ||
      typeof parsed.currentIndex !==
        "number" ||
      typeof parsed.endAt !==
        "number" ||
      typeof parsed.answers !==
        "object"
    ) {
      return createTest(
        subject,
        questionCount
      );
    }

    const remainingSeconds =
      Math.max(
        0,
        Math.ceil(
          (parsed.endAt -
            Date.now()) /
            1000
        )
      );

    /*
     * Saved test expired while the
     * browser/app was closed.
     */
    if (
      remainingSeconds <= 0
    ) {
      return {
        ...parsed,

        remainingSeconds: 0,

        submitted: true,

        submittedAt:
          parsed.submittedAt ||
          Date.now(),
      };
    }

    /*
     * Resume saved test.
     */
    return {
      ...parsed,

      currentIndex:
        Math.min(
          Math.max(
            parsed.currentIndex,
            0
          ),
          parsed.questions.length -
            1
        ),

      remainingSeconds,

      submitted: false,
    };
  } catch {
    return createTest(
      subject,
      questionCount
    );
  }
}

/* ========================================
   PRACTICE TEST SESSION
   ======================================== */

function PracticeTestSession({
  subject,
  subjectId,
  questionCount,
  forceNew,
}) {
  const navigate =
    useNavigate();

  const [language, setLanguage] =
    useState(getLanguage);

  /*
   * The test is created/resumed once
   * when this session mounts.
   *
   * No initialization effect is needed.
   *
   * The parent component supplies a key so
   * changing the requested test creates a
   * completely fresh session.
   */
  const [test, setTest] =
    useState(() =>
      loadSavedTest(
        subjectId,
        subject,
        questionCount,
        forceNew
      )
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [
    questionPaletteOpen,
    setQuestionPaletteOpen,
  ] = useState(false);

  const questions = useMemo(
    () =>
      test?.questions || [],
    [test]
  );

  /* ======================================
     LANGUAGE
     ====================================== */

  useEffect(() => {
    const updateLanguage = () => {
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
     SAVE TEST
     ====================================== */

  useEffect(() => {
    if (
      !test ||
      !subjectId
    ) {
      return;
    }

    localStorage.setItem(
      `${TEST_STORAGE_PREFIX}${subjectId}`,
      JSON.stringify(test)
    );

    window.dispatchEvent(
      new Event(
        "ap-tet-test-change"
      )
    );
  }, [
    test,
    subjectId,
  ]);

  /* ======================================
     RESULT REDIRECT
     ====================================== */

  useEffect(() => {
    if (!test?.submitted) {
      return;
    }

    navigate(
      `/practice-test/${subjectId}/result`,
      {
        replace: true,
      }
    );
  }, [
    test?.submitted,
    navigate,
    subjectId,
  ]);

  /* ======================================
     RECORD COMPLETED TEST
     ====================================== */

  useEffect(() => {
    if (!test?.submitted) {
      return;
    }

    recordCompletedTest(
      test,
      subjectId
    );
  }, [
    test,
    subjectId,
  ]);

  /* ======================================
     TIMER
     ====================================== */

  const endAt = test?.endAt;
  const isSubmitted = test?.submitted;

  useEffect(() => {
    if (
      !endAt ||
      isSubmitted ||
      questions.length === 0
    ) {
      return undefined;
    }

    const updateTimer = () => {
      const remainingSeconds =
        Math.max(
          0,
          Math.ceil(
            (endAt -
              Date.now()) /
              1000
          )
        );

      if (
        remainingSeconds <= 0
      ) {
        setTest(
          (current) => {
            if (
              !current ||
              current.submitted
            ) {
              return current;
            }

            return {
              ...current,

              remainingSeconds: 0,

              submitted: true,

              submittedAt:
                Date.now(),
            };
          }
        );

        return;
      }

      setTest(
        (current) => {
          if (
            !current ||
            current.submitted
          ) {
            return current;
          }

          if (
            current.remainingSeconds ===
            remainingSeconds
          ) {
            return current;
          }

          return {
            ...current,
            remainingSeconds,
          };
        }
      );
    };

    updateTimer();

    const timerId =
      window.setInterval(
        updateTimer,
        1000
      );

    return () => {
      window.clearInterval(
        timerId
      );
    };
  }, [
    endAt,
    isSubmitted,
    questions.length,
  ]);

  /* ======================================
     INVALID SUBJECT
     ====================================== */

  if (!subject) {
    return (
      <main className="practice-test-page">
        <div className="practice-test-container">

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

  /* ======================================
     NO TEST
     ====================================== */

  if (!test) {
    return null;
  }

  /* ======================================
     NO QUESTIONS
     ====================================== */

  if (
    questions.length === 0
  ) {
    return (
      <main className="practice-test-page">
        <div className="practice-test-container">

          <header className="practice-test-header">

            <button
              type="button"
              className="practice-test-back-button"
              onClick={() =>
                navigate(
                  `/question-menu/${subjectId}`
                )
              }
            >
              <ArrowLeft
                size={19}
              />
            </button>

            <div className="practice-test-subject">

              <div
                className="practice-test-badge"
                style={{
                  background:
                    subject.gradient,
                }}
              >
                {subject.shortName}
              </div>

              <div>
                <span className="section-kicker">
                  Practice Test
                </span>

                <h1>
                  {subject.name}
                </h1>
              </div>

            </div>

          </header>

          <div className="practice-test-empty">

            <Clock3
              size={30}
            />

            <h2>
              No questions loaded yet
            </h2>

            <p>
              Add questions to{" "}
              <strong>
                src/data/
                {subjectId}.js
              </strong>{" "}
              before starting a test.
            </p>

          </div>

        </div>
      </main>
    );
  }

  /* ======================================
     CURRENT QUESTION
     ====================================== */

  const currentIndex =
    Math.min(
      Math.max(
        test.currentIndex,
        0
      ),
      questions.length - 1
    );

  const currentQuestion =
    questions[
      currentIndex
    ];

  const selectedOption =
    test.answers[
      currentQuestion.id
    ] || null;

  const answeredCount =
    getSafeAnswerCount(test);

  /* ======================================
     FORMAT TIME
     ====================================== */

  const formatTime = (
    seconds
  ) => {
    const safeSeconds =
      Math.max(
        0,
        Number(seconds) || 0
      );

    const minutes =
      Math.floor(
        safeSeconds / 60
      );

    const remaining =
      safeSeconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remaining
    ).padStart(
      2,
      "0"
    )}`;
  };

  /* ======================================
     SELECT OPTION
     ====================================== */

  const selectOption = (
    letter
  ) => {
    if (
      test.submitted
    ) {
      return;
    }

    setTest(
      (current) => ({
        ...current,

        answers: {
          ...current.answers,

          [currentQuestion.id]:
            letter,
        },
      })
    );
  };

  /* ======================================
     GO TO QUESTION
     ====================================== */

  const goToQuestion = (
    index
  ) => {
    if (
      index < 0 ||
      index >=
        questions.length ||
      test.submitted
    ) {
      return;
    }

    setTest(
      (current) => ({
        ...current,
        currentIndex: index,
      })
    );

    setQuestionPaletteOpen(
      false
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ======================================
     EXIT TEST
     ====================================== */

  const exitTest = () => {
    if (
      test.submitted
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Exit this test?\n\nYour progress will be saved and you can resume the test later."
      );

    if (!confirmed) {
      return;
    }

    /*
     * The persistence effect already saved
     * the current test.
     */
    window.dispatchEvent(
      new Event(
        "ap-tet-test-change"
      )
    );

    navigate(
      `/question-menu/${subjectId}`
    );
  };

  /* ======================================
     SUBMIT TEST
     ====================================== */

  const submitTest = () => {
    if (
      submitting ||
      test.submitted
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Submit your test?\n\nAnswered: ${answeredCount}/${questions.length}`
      );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    const completedTest = {
      ...test,

      submitted: true,

      submittedAt:
        Date.now(),

      remainingSeconds:
        Math.max(
          0,
          Math.ceil(
            (test.endAt -
              Date.now()) /
              1000
          )
        ),
    };

    setTest(
      completedTest
    );

    window.dispatchEvent(
      new Event(
        "ap-tet-test-change"
      )
    );
  };

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

          return {
            letter,

            option:
              currentQuestion
                .options[
                optionIndex
              ],
          };
        }
      )
      .filter(
        ({ option }) =>
          Boolean(option)
      );

  return (
    <main className="practice-test-page">
      <div className="practice-test-container">

        {/* Header */}

        <header className="practice-test-header">

          <button
            type="button"
            className="practice-test-back-button"
            onClick={
              exitTest
            }
            disabled={
              test.submitted
            }
            aria-label="Exit test"
          >
            <ArrowLeft
              size={19}
            />
          </button>

          <div className="practice-test-subject">

            <div
              className="practice-test-badge"
              style={{
                background:
                  subject.gradient,
              }}
            >
              {subject.shortName}
            </div>

            <div>

              <span className="section-kicker">
                Practice Test
              </span>

              <h1>
                {subject.name}
              </h1>

              <p>
                {answeredCount} /{" "}
                {questions.length}{" "}
                answered
              </p>

            </div>

          </div>

          <div
            className={`practice-test-timer ${
              test.remainingSeconds <=
              60
                ? "timer-warning"
                : ""
            }`}
          >

            <Clock3
              size={17}
            />

            <strong>
              {formatTime(
                test.remainingSeconds
              )}
            </strong>

          </div>

        </header>

        {/* Progress */}

        <div className="practice-test-progress">

          <div className="practice-test-progress-info">

            <span>
              Question{" "}
              {currentIndex + 1}{" "}
              of{" "}
              {questions.length}
            </span>

            <span>
              {answeredCount}{" "}
              answered
            </span>

          </div>

          <div className="practice-test-progress-track">

            <div
              className="practice-test-progress-bar"
              style={{
                width: `${
                  ((currentIndex +
                    1) /
                    questions.length) *
                  100
                }%`,
              }}
            />

          </div>

        </div>

        {/* Question Navigator */}

        <div className="practice-test-palette-section">

          <button
            type="button"
            className="practice-test-palette-toggle"
            onClick={() =>
              setQuestionPaletteOpen(
                (open) =>
                  !open
              )
            }
            aria-expanded={
              questionPaletteOpen
            }
          >

            <span>

              <Grid2X2
                size={16}
              />

              Question Navigator

            </span>

            <span className="practice-test-palette-toggle-right">

              {answeredCount}/
              {
                questions.length
              }

              <ChevronDown
                size={16}
                className={
                  questionPaletteOpen
                    ? "palette-open"
                    : ""
                }
              />

            </span>

          </button>

          {questionPaletteOpen && (
            <div className="practice-test-palette">

              <div className="practice-test-palette-header">

                <span>
                  Jump to question
                </span>

                <span>
                  {answeredCount}{" "}
                  answered
                </span>

              </div>

              <div className="practice-test-palette-grid">

                {questions.map(
                  (
                    question,
                    index
                  ) => {
                    const answered =
                      Boolean(
                        test.answers[
                          question.id
                        ]
                      );

                    const current =
                      index ===
                      currentIndex;

                    let className =
                      "practice-test-palette-number";

                    if (
                      current
                    ) {
                      className +=
                        " current";
                    } else if (
                      answered
                    ) {
                      className +=
                        " answered";
                    }

                    return (
                      <button
                        type="button"
                        key={
                          question.id
                        }
                        className={
                          className
                        }
                        onClick={() =>
                          goToQuestion(
                            index
                          )
                        }
                        disabled={
                          test.submitted
                        }
                        aria-label={`Go to question ${
                          index + 1
                        }`}
                        aria-current={
                          current
                            ? "step"
                            : undefined
                        }
                      >
                        {index +
                          1}
                      </button>
                    );
                  }
                )}

              </div>

              <div className="practice-test-palette-legend">

                <span>
                  <i className="legend-current" />
                  Current
                </span>

                <span>
                  <i className="legend-answered" />
                  Answered
                </span>

                <span>
                  <i className="legend-unanswered" />
                  Unanswered
                </span>

              </div>

            </div>
          )}

        </div>

        {/* Question */}

        <section className="practice-test-question">

          <div className="practice-test-question-label">
            Question{" "}
            {currentIndex + 1}
          </div>

          <div className="practice-test-question-text">

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

          <div className="practice-test-options">

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

                return (
                  <button
                    type="button"
                    key={letter}
                    className={
                      isSelected
                        ? "practice-test-option selected"
                        : "practice-test-option"
                    }
                    onClick={() =>
                      selectOption(
                        letter
                      )
                    }
                    disabled={
                      test.submitted
                    }
                  >

                    <span className="practice-test-option-letter">
                      {letter}
                    </span>

                    <span className="practice-test-option-text">

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

                    {isSelected && (
                      <CheckCircle2
                        size={19}
                      />
                    )}

                  </button>
                );
              }
            )}

          </div>

        </section>

        {/* Navigation */}

        <nav className="practice-test-navigation">

          <button
            type="button"
            className="practice-test-nav-button"
            disabled={
              currentIndex ===
                0 ||
              test.submitted
            }
            onClick={() =>
              goToQuestion(
                currentIndex - 1
              )
            }
          >

            <ArrowLeft
              size={17}
            />

            Previous

          </button>

          <span>
            {currentIndex + 1}
          </span>

          <button
            type="button"
            className="practice-test-nav-button"
            disabled={
              currentIndex ===
                questions.length -
                  1 ||
              test.submitted
            }
            onClick={() =>
              goToQuestion(
                currentIndex + 1
              )
            }
          >

            Next

            <ArrowLeft
              size={17}
              className="next-icon"
            />

          </button>

        </nav>

        {/* Submit */}

        <button
          type="button"
          className="practice-test-submit"
          onClick={
            submitTest
          }
          disabled={
            submitting ||
            test.submitted
          }
        >

          <Send size={17} />

          {submitting
            ? "Submitted"
            : "Submit Test"}

        </button>

        {test.submitted && (
          <div className="practice-test-submitted">
            Test submitted.
            Opening results...
          </div>
        )}

      </div>
    </main>
  );
}

/* ========================================
   MAIN COMPONENT
   ======================================== */

function PracticeTest() {
  const { subjectId } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const subject =
    subjectConfig[
      subjectId
    ];

  const availableQuestionCount =
    subject
      ? getAvailableQuestions(
          subject
        ).length
      : 0;

  const requestedCount =
    Number(
      searchParams.get(
        "count"
      )
    );

  const questionCount =
    Number.isFinite(
      requestedCount
    ) &&
    requestedCount > 0
      ? Math.min(
          requestedCount,
          availableQuestionCount
        )
      : Math.min(
          20,
          availableQuestionCount
        );

  const forceNew =
    searchParams.get(
      "new"
    ) === "1";

  if (!subject) {
    return (
      <main className="practice-test-page">
        <div className="practice-test-container">

          <h1>
            Subject not found
          </h1>

        </div>
      </main>
    );
  }

  return (
    <PracticeTestSession
      key={`${subjectId}-${questionCount}-${forceNew ? "new" : "saved"}`}
      subject={subject}
      subjectId={subjectId}
      questionCount={
        questionCount
      }
      forceNew={
        forceNew
      }
    />
  );
}

export default PracticeTest;