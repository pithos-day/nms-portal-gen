import { createContext, useContext, useState } from 'react';
import en from './en';
import ja from './ja';

// ─── Types ───────────────────────────────────────────────────────────────────

type Language = 'ja' | 'en';

type TranslationKey = keyof typeof ja;

type TranslationParams = Record<string, string | number>;

// ─── Translations Map ────────────────────────────────────────────────────────

const translations: Record<Language, Record<TranslationKey, string>> = { ja, en };

// ─── Context ─────────────────────────────────────────────────────────────────

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem('lang');
    if (stored === 'ja' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return navigator.language.startsWith('ja') ? 'ja' : 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  function setLang(newLang: Language) {
    setLangState(newLang);
    try {
      localStorage.setItem('lang', newLang);
    } catch {
      // ignore
    }
  }

  function t(key: TranslationKey, params?: TranslationParams): string {
    let text = translations[lang][key] ?? translations.ja[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
