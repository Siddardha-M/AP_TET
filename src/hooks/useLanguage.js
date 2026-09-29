import { useEffect, useState } from "react";

const LANGUAGE_KEY = "ap-tet-language";

const DEFAULT_LANGUAGE = "both";

function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);

    if (
      saved === "english" ||
      saved === "telugu" ||
      saved === "both"
    ) {
      return saved;
    }

    return DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveLanguage(language) {
  if (
    language !== "english" &&
    language !== "telugu" &&
    language !== "both"
  ) {
    return;
  }

  localStorage.setItem(LANGUAGE_KEY, language);

  window.dispatchEvent(
    new CustomEvent("ap-tet-language-change", {
      detail: language,
    })
  );
}

export default function useLanguage() {
  const [language, setLanguage] = useState(getSavedLanguage);

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail);
    };

    window.addEventListener(
      "ap-tet-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "ap-tet-language-change",
        handleLanguageChange
      );
    };
  }, []);

  return {
    language,
    changeLanguage: saveLanguage,
  };
}