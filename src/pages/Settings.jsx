import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Type,
  Sparkles,
  RotateCcw,
  Languages,
  Check,
} from "lucide-react";

const SETTINGS_KEY = "ap-tet-settings";

const defaultSettings = {
  theme: "light",
  textSize: "medium",
  animations: true,
  language: "both",
};

function getSavedSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    };
  } catch {
    return defaultSettings;
  }
}

function Settings({ onClose }) {
  const [settings, setSettings] = useState(getSavedSettings);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );

    applySettings(settings);
  }, [settings]);


  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleResetProgress = () => {
    const confirmed = window.confirm(
      "Reset all AP TET progress and test history? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setResetting(true);

    const keysToKeep = [SETTINGS_KEY];

    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    setTimeout(() => {
      setResetting(false);
      window.location.reload();
    }, 300);
  };

  return (
    <div className="settings-page">
      <div
        className="settings-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="settings-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <header className="settings-header">
          <button
            className="settings-back"
            onClick={onClose}
            aria-label="Close settings"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="settings-title">
            <span className="section-kicker">Preferences</span>

            <h1 id="settings-title">
              Settings
            </h1>
          </div>

        </header>

        {/* Appearance */}

        <section className="settings-section">
          <div className="settings-section-title">
            <h2>Appearance</h2>

            <p>
              Choose how AP TET looks on your device.
            </p>
          </div>

          <div className="settings-card">
            <div className="settings-row settings-column-mobile">
              <div className="settings-row-icon purple">
                {settings.theme === "dark" ? (
                  <Moon size={19} />
                ) : settings.theme === "system" ? (
                  <Monitor size={19} />
                ) : (
                  <Sun size={19} />
                )}
              </div>

              <div className="settings-row-content">
                <strong>Theme</strong>

                <span>
                  {settings.theme === "light" &&
                    "Light theme"}

                  {settings.theme === "dark" &&
                    "Dark theme"}

                  {settings.theme === "system" &&
                    "Follow your system preference"}
                </span>
              </div>

              <div className="theme-options">
                <button
                  type="button"
                  className={`theme-option ${
                    settings.theme === "light"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting("theme", "light")
                  }
                >
                  <Sun size={16} />
                  <span>Light</span>

                  {settings.theme === "light" && (
                    <Check size={14} />
                  )}
                </button>

                <button
                  type="button"
                  className={`theme-option ${
                    settings.theme === "dark"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting("theme", "dark")
                  }
                >
                  <Moon size={16} />
                  <span>Dark</span>

                  {settings.theme === "dark" && (
                    <Check size={14} />
                  )}
                </button>

                <button
                  type="button"
                  className={`theme-option ${
                    settings.theme === "system"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting("theme", "system")
                  }
                >
                  <Monitor size={16} />
                  <span>System</span>

                  {settings.theme === "system" && (
                    <Check size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Reading */}

        <section className="settings-section">
          <div className="settings-section-title">
            <h2>Reading</h2>

            <p>
              Adjust text size for comfortable studying.
            </p>
          </div>

          <div className="settings-card">
            <div className="settings-row settings-column-mobile">
              <div className="settings-row-icon teal">
                <Type size={19} />
              </div>

              <div className="settings-row-content">
                <strong>Text size</strong>

                <span>
                  {settings.textSize === "small" &&
                    "Compact text"}

                  {settings.textSize === "medium" &&
                    "Standard text"}

                  {settings.textSize === "large" &&
                    "Larger text"}
                </span>
              </div>

              <div className="size-options">
                <button
                  type="button"
                  className={
                    settings.textSize === "small"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateSetting("textSize", "small")
                  }
                >
                  Small
                </button>

                <button
                  type="button"
                  className={
                    settings.textSize === "medium"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateSetting("textSize", "medium")
                  }
                >
                  Medium
                </button>

                <button
                  type="button"
                  className={
                    settings.textSize === "large"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateSetting("textSize", "large")
                  }
                >
                  Large
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Experience */}

        <section className="settings-section">
          <div className="settings-section-title">
            <h2>Experience</h2>

            <p>
              Control visual motion throughout the app.
            </p>
          </div>

          <div className="settings-card">
            <div className="settings-row">
              <div className="settings-row-icon amber">
                <Sparkles size={19} />
              </div>

              <div className="settings-row-content">
                <strong>Animations</strong>

                <span>
                  Smooth page and interaction transitions.
                </span>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.animations}
                  onChange={(event) =>
                    updateSetting(
                      "animations",
                      event.target.checked
                    )
                  }
                />

                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </section>

        {/* Language */}

        <section className="settings-section">
          <div className="settings-section-title">
            <h2>Language</h2>

            <p>
              Choose how questions and the interface are
              displayed.
            </p>
          </div>

          <div className="settings-card">
            <div className="settings-row settings-column-mobile">
              <div className="settings-row-icon teal">
                <Languages size={19} />
              </div>

              <div className="settings-row-content">
                <strong>Question language</strong>

                <span>
                  {settings.language === "english" &&
                    "English"}

                  {settings.language === "telugu" &&
                    "Telugu"}

                  {settings.language === "both" &&
                    "English + Telugu"}
                </span>
              </div>

              <div className="language-options">
                <button
                  type="button"
                  className={
                    settings.language === "english"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateSetting("language", "english")
                  }
                >
                  English
                </button>

                <button
                  type="button"
                  className={
                    settings.language === "telugu"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateSetting("language", "telugu")
                  }
                >
                  తెలుగు
                </button>

                <button
                  type="button"
                  className={
                    settings.language === "both"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateSetting("language", "both")
                  }
                >
                  Both
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Data */}

        <section className="settings-section danger-section">
          <div className="settings-section-title">
            <h2>Data</h2>

            <p>
              Manage your locally saved preparation data.
            </p>
          </div>

          <button
            type="button"
            className="reset-card"
            onClick={handleResetProgress}
            disabled={resetting}
          >
            <div className="settings-row-icon coral">
              <RotateCcw size={19} />
            </div>

            <div className="settings-row-content">
              <strong>
                {resetting
                  ? "Resetting..."
                  : "Reset all progress"}
              </strong>

              <span>
                Delete saved practice progress and test
                history.
              </span>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}

function applySettings(settings) {
  const root = document.documentElement;

  /* Theme */

  root.dataset.theme = settings.theme;

  /* Text size */

  root.dataset.textSize = settings.textSize;

  /* Animations */

  root.dataset.animations = settings.animations
    ? "on"
    : "off";
}

export default Settings;