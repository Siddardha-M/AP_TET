import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  ArrowUpRight,
  Clock3,
  Play,
  Settings as SettingsIcon,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import SettingsPanel from "./Settings.jsx";

import * as cdpData from "../data/cdp.js";
import * as teluguData from "../data/telugu.js";
import * as englishData from "../data/english.js";
import * as mathematicsData from "../data/mathematics.js";
import * as evsData from "../data/evs.js";

const ANALYSIS_STORAGE_KEY =
  "ap-tet-analysis";

const TEST_STORAGE_PREFIX =
  "ap-tet-practice-test-";

const subjects = [
  {
    id: "cdp",
    name: "Child Development & Pedagogy",
    shortName: "CDP",
    gradient: "var(--gradient-purple)",
    data: cdpData,
  },
  {
    id: "telugu",
    name: "Telugu",
    shortName: "తెలుగు",
    gradient: "var(--gradient-coral)",
    data: teluguData,
  },
  {
    id: "english",
    name: "English",
    shortName: "English",
    gradient: "var(--gradient-teal)",
    data: englishData,
  },
  {
    id: "mathematics",
    name: "Mathematics",
    shortName: "Maths",
    gradient: "var(--gradient-amber)",
    data: mathematicsData,
  },
  {
    id: "evs",
    name: "Environmental Studies",
    shortName: "EVS",
    gradient: "var(--gradient-purple)",
    data: evsData,
  },
];

/* ========================================
   QUESTION HELPERS
   ======================================== */

function extractQuestions(module) {
  if (Array.isArray(module.default)) {
    return module.default;
  }

  const arrayExport =
    Object.values(module).find(
      (value) => Array.isArray(value)
    );

  return arrayExport || [];
}

function getQuestionCount(subject) {
  return extractQuestions(
    subject.data
  ).filter(
    (question) =>
      question &&
      question.id &&
      Array.isArray(question.options) &&
      question.options.length >= 4
  ).length;
}

/* ========================================
   ANALYSIS
   ======================================== */

function getSavedAnalysis() {
  try {
    const saved =
      localStorage.getItem(
        ANALYSIS_STORAGE_KEY
      );

    if (!saved) {
      return {
        testsTaken: 0,
        correct: 0,
        wrong: 0,
        totalDone: 0,
      };
    }

    const parsed =
      JSON.parse(saved);

    return {
      testsTaken:
        Number(
          parsed.testsTaken
        ) || 0,

      correct:
        Number(
          parsed.correct
        ) || 0,

      wrong:
        Number(
          parsed.wrong
        ) || 0,

      totalDone:
        Number(
          parsed.totalDone
        ) || 0,
    };
  } catch {
    return {
      testsTaken: 0,
      correct: 0,
      wrong: 0,
      totalDone: 0,
    };
  }
}

/* ========================================
   CONTINUE TEST
   ======================================== */

function getUnfinishedTest() {
  const unfinishedTests = [];

  try {
    for (const subject of subjects) {
      const saved =
        localStorage.getItem(
          `${TEST_STORAGE_PREFIX}${subject.id}`
        );

      if (!saved) {
        continue;
      }

      const parsed =
        JSON.parse(saved);

      if (
        !parsed ||
        parsed.submitted ||
        !Array.isArray(
          parsed.questions
        ) ||
        parsed.questions.length === 0
      ) {
        continue;
      }

      const remainingSeconds =
        Math.max(
          0,
          Number(
            parsed.remainingSeconds
          ) || 0
        );

      if (
        remainingSeconds <= 0
      ) {
        continue;
      }

      unfinishedTests.push({
        subject,
        test: parsed,
      });
    }

    unfinishedTests.sort(
      (a, b) =>
        (Number(
          b.test.startedAt
        ) || 0) -
        (Number(
          a.test.startedAt
        ) || 0)
    );

    return (
      unfinishedTests[0] ||
      null
    );
  } catch {
    return null;
  }
}

function formatTime(seconds) {
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
}

/* ========================================
   HOME
   ======================================== */

function Home() {
  const navigate =
    useNavigate();

  const [
    settingsOpen,
    setSettingsOpen,
  ] = useState(false);

  const [
    analysis,
    setAnalysis,
  ] = useState(
    getSavedAnalysis
  );

  const [
    unfinishedTest,
    setUnfinishedTest,
  ] = useState(null);

  const [
    analysisExpanded,
    setAnalysisExpanded,
  ] = useState(false);

  /*
   * Real question counts.
   */
  const subjectQuestionCounts =
    useMemo(() => {
      const counts = {};

      for (
        const subject of subjects
      ) {
        counts[subject.id] =
          getQuestionCount(
            subject
          );
      }

      return counts;
    }, []);

  /*
   * Derived analysis values.
   */
  const attempted =
    analysis.correct +
    analysis.wrong;

  const accuracy =
    attempted > 0
      ? Math.round(
          (analysis.correct /
            attempted) *
            100
        )
      : 0;

  /*
   * Refresh Home data.
   */
  useEffect(() => {
    const updateHomeData =
      () => {
        setAnalysis(
          getSavedAnalysis()
        );

        setUnfinishedTest(
          getUnfinishedTest()
        );
      };

    updateHomeData();

    window.addEventListener(
      "ap-tet-analysis-change",
      updateHomeData
    );

    window.addEventListener(
      "ap-tet-test-change",
      updateHomeData
    );

    window.addEventListener(
      "storage",
      updateHomeData
    );

    window.addEventListener(
      "focus",
      updateHomeData
    );

    return () => {
      window.removeEventListener(
        "ap-tet-analysis-change",
        updateHomeData
      );

      window.removeEventListener(
        "ap-tet-test-change",
        updateHomeData
      );

      window.removeEventListener(
        "storage",
        updateHomeData
      );

      window.removeEventListener(
        "focus",
        updateHomeData
      );
    };
  }, []);

  /*
   * Refresh when returning to the tab.
   */
  useEffect(() => {
    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          setAnalysis(
            getSavedAnalysis()
          );

          setUnfinishedTest(
            getUnfinishedTest()
          );
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);

  const continueSubject =
    unfinishedTest?.subject;

  const continueTest =
    unfinishedTest?.test;

  const continueQuestion =
    continueTest
      ? Math.min(
          Math.max(
            Number(
              continueTest.currentIndex
            ) || 0,
            0
          ),
          continueTest.questions
            .length - 1
        ) + 1
      : 0;

  return (
    <main className="home-page">
      <div className="home-container">

        {/* ==================================
            HEADER
            ================================== */}

        <header className="home-header">

          <div>
            <div className="brand">

              <div className="brand-icon">
                <BookOpen
                  size={20}
                  strokeWidth={2.3}
                />
              </div>

              <span>
                AP TET 1A
              </span>

            </div>

            <p className="brand-subtitle">
              Teacher Eligibility Test ·
              Practice Platform
            </p>
          </div>

          {/* Settings + Analysis */}

          <div className="header-actions">

            <button
              type="button"
              className="icon-button"
              aria-label="Settings"
              onClick={() =>
                setSettingsOpen(
                  true
                )
              }
            >
              <SettingsIcon
                size={20}
              />
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label="Analysis"
              onClick={() =>
                navigate("/analysis")
              }
            >
              <BarChart3
                size={20}
              />
            </button>

          </div>

        </header>

        {/* ==================================
            ANALYSIS
            ================================== */}

        <section className="home-analysis-section">

          <div
            className={`analysis-slide ${
              analysisExpanded
                ? "analysis-expanded"
                : ""
            }`}
          >

            <div className="analysis-slide-header">

              <div>
                <span className="section-kicker">
                  Your progress
                </span>

                <h2>
                  Keep going
                </h2>
              </div>

              <button
                type="button"
                className={`analysis-view-button ${
                  analysisExpanded
                    ? "analysis-button-open"
                    : ""
                }`}
                aria-label={
                  analysisExpanded
                    ? "Collapse analysis"
                    : "Expand analysis"
                }
                aria-expanded={
                  analysisExpanded
                }
                onClick={() =>
                  setAnalysisExpanded(
                    (current) =>
                      !current
                  )
                }
              >
                <ArrowUpRight
                  size={18}
                  strokeWidth={2.2}
                />
              </button>

            </div>

            {/* Main statistics */}

            <div className="analysis-stats">

              <div className="analysis-stat">
                <span>
                  Tests taken
                </span>

                <strong>
                  {
                    analysis.testsTaken
                  }
                </strong>
              </div>

              <div className="analysis-stat">
                <span>
                  Correct
                </span>

                <strong>
                  {
                    analysis.correct
                  }
                </strong>
              </div>

              <div className="analysis-stat">
                <span>
                  Wrong
                </span>

                <strong>
                  {
                    analysis.wrong
                  }
                </strong>
              </div>

              <div className="analysis-stat">
                <span>
                  Total done
                </span>

                <strong>
                  {
                    analysis.totalDone
                  }
                </strong>
              </div>

            </div>

            {/* Expanded details */}

            {analysisExpanded && (
              <div className="analysis-expanded-content">

                <div className="analysis-detail-grid">

                  <div className="analysis-detail-card">
                    <div className="analysis-detail-icon purple">
                      <Target
                        size={17}
                      />
                    </div>

                    <div>
                      <span>
                        Accuracy
                      </span>

                      <strong>
                        {accuracy}%
                      </strong>
                    </div>
                  </div>

                  <div className="analysis-detail-card">
                    <div className="analysis-detail-icon teal">
                      <CheckCircle2
                        size={17}
                      />
                    </div>

                    <div>
                      <span>
                        Attempted
                      </span>

                      <strong>
                        {attempted}
                      </strong>
                    </div>
                  </div>

                  <div className="analysis-detail-card">
                    <div className="analysis-detail-icon coral">
                      <XCircle
                        size={17}
                      />
                    </div>

                    <div>
                      <span>
                        Wrong
                      </span>

                      <strong>
                        {analysis.wrong}
                      </strong>
                    </div>
                  </div>

                </div>

                <div className="analysis-detail-summary">

                  <div>
                    <span>
                      Questions answered
                    </span>

                    <strong>
                      {
                        analysis.correct
                      }{" "}
                      correct out of{" "}
                      {
                        attempted
                      }
                    </strong>
                  </div>

                  <div className="analysis-detail-bar">
                    <div
                      className="analysis-detail-bar-fill"
                      style={{
                        width: `${accuracy}%`,
                      }}
                    />
                  </div>

                </div>

              </div>
            )}

          </div>

        </section>

        {/* ==================================
            CONTINUE
            ================================== */}

        <section className="continue-section">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                Continue
              </span>

              <h2>
                Pick up where you left off
              </h2>
            </div>

          </div>

          {unfinishedTest &&
          continueSubject &&
          continueTest ? (

            <Link
              to={`/practice-test/${continueSubject.id}?count=${continueTest.questions.length}`}
              className="continue-card"
            >

              <div className="continue-icon">
                <Play size={21} />
              </div>

              <div className="continue-info">

                <span>
                  Resume Practice Test
                </span>

                <strong>
                  {
                    continueSubject.name
                  }
                </strong>

                <small>

                  Question{" "}
                  {
                    continueQuestion
                  }{" "}
                  of{" "}
                  {
                    continueTest
                      .questions.length
                  }

                  {" · "}

                  <Clock3
                    size={12}
                    style={{
                      display:
                        "inline",
                      verticalAlign:
                        "middle",
                    }}
                  />

                  {" "}

                  {
                    formatTime(
                      continueTest.remainingSeconds
                    )
                  }{" "}
                  remaining

                </small>

              </div>

              <ChevronRight
                className="subject-arrow"
                size={20}
              />

            </Link>

          ) : (

            <div className="continue-card">

              <div className="continue-icon">
                <BookOpen
                  size={23}
                />
              </div>

              <div className="continue-info">

                <span>
                  Ready to begin
                </span>

                <strong>
                  No saved practice yet
                </strong>

                <small>
                  Start practicing a subject
                  to see your progress here.
                </small>

              </div>

            </div>

          )}

        </section>

        {/* ==================================
            SUBJECTS
            ================================== */}

        <section className="subjects-section">

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                Paper 1A
              </span>

              <h2>
                Choose a subject
              </h2>
            </div>

          </div>

          <div className="subject-grid">

            {subjects.map(
              (subject) => {

                const questionCount =
                  subjectQuestionCounts[
                    subject.id
                  ] || 0;

                return (
                  <button
                    type="button"
                    key={subject.id}
                    className="subject-card"
                    style={{
                      "--subject-gradient":
                        subject.gradient,
                    }}
                    onClick={() =>
                      navigate(
                        `/question-menu/${subject.id}`
                      )
                    }
                  >

                    <div className="subject-icon">
                      {
                        subject.shortName
                      }
                    </div>

                    <div className="subject-content">

                      <h3>
                        {
                          subject.name
                        }
                      </h3>

                      <p>
                        {
                          questionCount
                        }{" "}
                        questions available
                      </p>

                    </div>

                    <ChevronRight
                      className="subject-arrow"
                      size={20}
                    />

                  </button>
                );
              }
            )}

          </div>

        </section>

        {/* ==================================
            FOOTER
            ================================== */}

        <section className="home-footer-card">

          <div>

            <span className="section-kicker">
              Your preparation
            </span>

            <h2>
              Everything in one place.
            </h2>

            <p>
              Track practice, review test
              performance, switch languages,
              and customize your study
              experience.
            </p>

          </div>

          <div className="footer-card-icon">
            <BarChart3
              size={28}
            />
          </div>

        </section>

        {/* ==================================
            SETTINGS
            ================================== */}

        {settingsOpen && (
          <SettingsPanel
            onClose={() =>
              setSettingsOpen(
                false
              )
            }
          />
        )}

      </div>
    </main>
  );
}

export default Home;