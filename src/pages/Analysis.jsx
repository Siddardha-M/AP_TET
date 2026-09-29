import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  Target,
  TrendingUp,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SESSION_HISTORY_KEY =
  "ap-tet-session-history";

const SUBJECTS = {
  cdp: "Child Development & Pedagogy",
  telugu: "Telugu",
  english: "English",
  mathematics: "Mathematics",
  evs: "Environmental Studies",
};

const MODE_CONFIG = {
  practice: {
    label: "Practice",
    icon: BookOpen,
  },

  practiceTest: {
    label: "Practice Test",
    icon: Clock3,
  },

  allQuestions: {
    label: "All Questions",
    icon: ListChecks,
  },
};

/* ========================================
   STORAGE
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

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (session) =>
        session &&
        typeof session === "object"
    );
  } catch {
    return [];
  }
}

/* ========================================
   HELPERS
   ======================================== */

function formatDuration(seconds) {
  const totalSeconds = Math.max(
    0,
    Number(seconds) || 0
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(
      minutes
    ).padStart(
      2,
      "0"
    )}m`;
  }

  return `${minutes}m ${String(
    remainingSeconds
  ).padStart(
    2,
    "0"
  )}s`;
}

function formatDateTime(timestamp) {
  const value = Number(timestamp);

  if (!Number.isFinite(value)) {
    return "Unknown time";
  }

  const date = new Date(value);

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function formatDateHeading(timestamp) {
  const value = Number(timestamp);

  if (!Number.isFinite(value)) {
    return "Unknown date";
  }

  const date = new Date(value);

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function getSubjectName(subjectId) {
  return (
    SUBJECTS[subjectId] ||
    subjectId ||
    "Unknown Subject"
  );
}

function getSafeNumber(value) {
  return Number.isFinite(
    Number(value)
  )
    ? Number(value)
    : 0;
}

/* ========================================
   ANALYSIS CALCULATIONS
   ======================================== */

function calculateAnalysis(sessions) {
  const initial = {
    totalSessions: 0,
    totalQuestions: 0,
    totalAttempted: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalUnanswered: 0,
    totalDuration: 0,

    byMode: {
      practice: {
        sessions: 0,
        questions: 0,
        attempted: 0,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        duration: 0,
      },

      practiceTest: {
        sessions: 0,
        questions: 0,
        attempted: 0,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        duration: 0,
      },

      allQuestions: {
        sessions: 0,
        questions: 0,
        attempted: 0,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        duration: 0,
      },
    },
  };

  return sessions.reduce(
    (result, session) => {
      const mode =
        session.mode;

      const totalQuestions =
        getSafeNumber(
          session.totalQuestions
        );

      const attempted =
        getSafeNumber(
          session.attempted
        );

      const correct =
        getSafeNumber(
          session.correct
        );

      const wrong =
        getSafeNumber(
          session.wrong
        );

      const unanswered =
        getSafeNumber(
          session.unanswered
        );

      const duration =
        getSafeNumber(
          session.durationSeconds
        );

      result.totalSessions += 1;

      result.totalQuestions +=
        totalQuestions;

      result.totalAttempted +=
        attempted;

      result.totalCorrect +=
        correct;

      result.totalWrong +=
        wrong;

      result.totalUnanswered +=
        unanswered;

      result.totalDuration +=
        duration;

      if (
        result.byMode[mode]
      ) {
        result.byMode[mode]
          .sessions += 1;

        result.byMode[mode]
          .questions +=
          totalQuestions;

        result.byMode[mode]
          .attempted +=
          attempted;

        result.byMode[mode]
          .correct +=
          correct;

        result.byMode[mode]
          .wrong +=
          wrong;

        result.byMode[mode]
          .unanswered +=
          unanswered;

        result.byMode[mode]
          .duration +=
          duration;
      }

      return result;
    },
    initial
  );
}

function getAccuracy(
  correct,
  attempted
) {
  const safeCorrect =
    getSafeNumber(correct);

  const safeAttempted =
    getSafeNumber(attempted);

  if (safeAttempted <= 0) {
    return 0;
  }

  return Math.round(
    (safeCorrect /
      safeAttempted) *
      100
  );
}

/* ========================================
   STAT CARD
   ======================================== */

function StatCard({
  icon: Icon,
  label,
  value,
  className = "",
}) {
  return (
    <div
      className={`analysis-stat-card ${className}`}
    >
      <div className="analysis-stat-card-icon">
        <Icon size={18} />
      </div>

      <div className="analysis-stat-card-content">
        <span>{label}</span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}

/* ========================================
   MODE SECTION
   ======================================== */

function ModeSection({
  mode,
  data,
}) {
  const config =
    MODE_CONFIG[mode];

  const Icon = config.icon;

  const accuracy =
    getAccuracy(
      data.correct,
      data.attempted
    );

  return (
    <section
      className="analysis-mode-section"
    >
      <div className="analysis-section-header">
        <div className="analysis-section-title">

          <div className="analysis-mode-icon">
            <Icon size={19} />
          </div>

          <div>
            <span className="section-kicker">
              {config.label}
            </span>

            <h2>
              {config.label} Analysis
            </h2>
          </div>

        </div>
      </div>

      <div className="analysis-stat-grid">

        <StatCard
          icon={BarChart3}
          label="Sessions"
          value={data.sessions}
        />

        <StatCard
          icon={FileText}
          label="Questions"
          value={data.questions}
        />

        <StatCard
          icon={Target}
          label="Attempted"
          value={data.attempted}
        />

        <StatCard
          icon={CheckCircle2}
          label="Correct"
          value={data.correct}
          className="analysis-success"
        />

        <StatCard
          icon={XCircle}
          label="Wrong"
          value={data.wrong}
          className="analysis-danger"
        />

        <StatCard
          icon={MinusCircle}
          label="Unanswered"
          value={data.unanswered}
        />

        <StatCard
          icon={TrendingUp}
          label="Accuracy"
          value={`${accuracy}%`}
          className="analysis-accent"
        />

        <StatCard
          icon={Clock3}
          label="Time spent"
          value={formatDuration(
            data.duration
          )}
        />

      </div>
    </section>
  );
}

/* ========================================
   SESSION HISTORY ITEM
   ======================================== */

function SessionHistoryItem({
  session,
}) {
  const mode =
    MODE_CONFIG[
      session.mode
    ];

  const Icon =
    mode?.icon ||
    FileText;

  const subject =
    getSubjectName(
      session.subjectId
    );

  const totalQuestions =
    getSafeNumber(
      session.totalQuestions
    );

  const correct =
    getSafeNumber(
      session.correct
    );

  const wrong =
    getSafeNumber(
      session.wrong
    );

  const unanswered =
    getSafeNumber(
      session.unanswered
    );

  const attempted =
    getSafeNumber(
      session.attempted
    );

  const accuracy =
    getAccuracy(
      correct,
      attempted
    );

  const timestamp =
    session.completedAt ||
    session.startedAt;

  return (
    <article className="analysis-history-item">

      <div className="analysis-history-icon">
        <Icon size={18} />
      </div>

      <div className="analysis-history-main">

        <div className="analysis-history-top">

          <div>
            <strong>
              {subject}
            </strong>

            <span>
              {mode?.label ||
                session.mode ||
                "Unknown Mode"}
            </span>
          </div>

          <time>
            {formatDateTime(
              timestamp
            )}
          </time>

        </div>

        <div className="analysis-history-stats">

          <span>
            {totalQuestions} questions
          </span>

          <span className="history-correct">
            {correct} correct
          </span>

          <span className="history-wrong">
            {wrong} wrong
          </span>

          <span>
            {unanswered} unanswered
          </span>

          <span>
            {accuracy}% accuracy
          </span>

          <span>
            {formatDuration(
              session.durationSeconds
            )}
          </span>

        </div>

      </div>

    </article>
  );
}

/* ========================================
   ANALYSIS
   ======================================== */

function Analysis() {
  const navigate =
    useNavigate();

  const [
    sessions,
    setSessions,
  ] = useState(
    getSessionHistory
  );

  /*
   * Reload when another page records
   * a new session.
   */
  useEffect(() => {
    const reloadSessions =
      () => {
        setSessions(
          getSessionHistory()
        );
      };

    window.addEventListener(
      "ap-tet-analysis-change",
      reloadSessions
    );

    window.addEventListener(
      "storage",
      reloadSessions
    );

    window.addEventListener(
      "focus",
      reloadSessions
    );

    return () => {
      window.removeEventListener(
        "ap-tet-analysis-change",
        reloadSessions
      );

      window.removeEventListener(
        "storage",
        reloadSessions
      );

      window.removeEventListener(
        "focus",
        reloadSessions
      );
    };
  }, []);

  /*
   * Newest session first.
   */
  const sortedSessions =
    useMemo(
      () =>
        [...sessions].sort(
          (a, b) =>
            getSafeNumber(
              b.completedAt ||
                b.startedAt
            ) -
            getSafeNumber(
              a.completedAt ||
                a.startedAt
            )
        ),
      [sessions]
    );

  const analysis =
    useMemo(
      () =>
        calculateAnalysis(
          sortedSessions
        ),
      [sortedSessions]
    );

  const overallAccuracy =
    getAccuracy(
      analysis.totalCorrect,
      analysis.totalAttempted
    );

  /*
   * Group history by date.
   */
  const groupedHistory =
    useMemo(() => {
      const groups = {};

      sortedSessions.forEach(
        (session) => {
          const timestamp =
            session.completedAt ||
            session.startedAt;

          const heading =
            formatDateHeading(
              timestamp
            );

          if (!groups[heading]) {
            groups[heading] = [];
          }

          groups[heading].push(
            session
          );
        }
      );

      return groups;
    }, [sortedSessions]);

  return (
    <main className="analysis-page">
      <div className="analysis-container">

        {/* ==================================
            HEADER
            ================================== */}

        <header className="analysis-page-header">

          <button
            type="button"
            className="analysis-back-button"
            onClick={() =>
              navigate("/")
            }
            aria-label="Back to home"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="analysis-page-title">

            <div className="analysis-page-icon">
              <BarChart3 size={21} />
            </div>

            <div>
              <span className="section-kicker">
                Performance
              </span>

              <h1>
                Analysis
              </h1>

              <p>
                Your complete preparation
                history.
              </p>
            </div>

          </div>

        </header>

        {/* ==================================
            OVERALL
            ================================== */}

        <section className="analysis-overall-section">

          <div className="analysis-section-header">

            <div>
              <span className="section-kicker">
                Overall
              </span>

              <h2>
                Your preparation
              </h2>

              <p>
                Combined performance across
                every recorded session.
              </p>
            </div>

          </div>

          <div className="analysis-overall-card">

            <div className="analysis-overall-primary">

              <span>
                Overall accuracy
              </span>

              <strong>
                {overallAccuracy}%
              </strong>

              <small>
                {analysis.totalCorrect} correct
                out of{" "}
                {analysis.totalAttempted}{" "}
                attempted
              </small>

            </div>

            <div className="analysis-overall-progress">

              <div className="analysis-progress-track">
                <div
                  className="analysis-progress-fill"
                  style={{
                    width: `${overallAccuracy}%`,
                  }}
                />
              </div>

            </div>

          </div>

          <div className="analysis-stat-grid">

            <StatCard
              icon={BarChart3}
              label="Total sessions"
              value={
                analysis.totalSessions
              }
            />

            <StatCard
              icon={FileText}
              label="Questions done"
              value={
                analysis.totalQuestions
              }
            />

            <StatCard
              icon={Target}
              label="Attempted"
              value={
                analysis.totalAttempted
              }
            />

            <StatCard
              icon={CheckCircle2}
              label="Correct"
              value={
                analysis.totalCorrect
              }
              className="analysis-success"
            />

            <StatCard
              icon={XCircle}
              label="Wrong"
              value={
                analysis.totalWrong
              }
              className="analysis-danger"
            />

            <StatCard
              icon={MinusCircle}
              label="Unanswered"
              value={
                analysis.totalUnanswered
              }
            />

            <StatCard
              icon={Clock3}
              label="Total time"
              value={formatDuration(
                analysis.totalDuration
              )}
            />

            <StatCard
              icon={TrendingUp}
              label="Accuracy"
              value={`${overallAccuracy}%`}
              className="analysis-accent"
            />

          </div>

        </section>

        {/* ==================================
            MODE ANALYSIS
            ================================== */}

        <ModeSection
          mode="practice"
          data={
            analysis.byMode.practice
          }
        />

        <ModeSection
          mode="practiceTest"
          data={
            analysis.byMode.practiceTest
          }
        />

        <ModeSection
          mode="allQuestions"
          data={
            analysis.byMode.allQuestions
          }
        />

        {/* ==================================
            HISTORY
            ================================== */}

        <section className="analysis-history-section">

          <div className="analysis-section-header">

            <div>
              <span className="section-kicker">
                History
              </span>

              <h2>
                Test & session history
              </h2>

              <p>
                Every recorded practice session,
                newest first.
              </p>
            </div>

            <span className="analysis-history-count">
              {sortedSessions.length}{" "}
              sessions
            </span>

          </div>

          {sortedSessions.length ===
          0 ? (
            <div className="analysis-empty">

              <BarChart3
                size={32}
              />

              <h3>
                No sessions recorded yet
              </h3>

              <p>
                Complete a Practice,
                Practice Test, or All Questions
                session and it will appear here.
              </p>

            </div>
          ) : (
            <div className="analysis-history-list">

              {Object.entries(
                groupedHistory
              ).map(
                ([
                  date,
                  dateSessions,
                ]) => (
                  <div
                    key={date}
                    className="analysis-history-group"
                  >

                    <div className="analysis-history-date">
                      {date}
                    </div>

                    {dateSessions.map(
                      (session) => (
                        <SessionHistoryItem
                          key={
                            session.id
                          }
                          session={
                            session
                          }
                        />
                      )
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* ==================================
            BACK BUTTON
            ================================== */}

        <button
          type="button"
          className="analysis-bottom-home-button"
          onClick={() =>
            navigate("/")
          }
        >
          <ArrowLeft size={17} />
          Back to Home
        </button>

      </div>
    </main>
  );
}

export default Analysis;