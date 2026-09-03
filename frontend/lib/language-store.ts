import { create } from 'zustand';

type Language = 'en' | 'hi';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en', // default language
  setLanguage: (lang) => set({ language: lang }),
}));
