import { useLanguageStore } from './language-store';
import en from './dictionaries/en.json';
import hi from './dictionaries/hi.json';

const dictionaries = {
  en,
  hi,
};

export function useTranslation() {
  const { language } = useLanguageStore();
  const t = dictionaries[language] as typeof en;
  return { t, language };
}
