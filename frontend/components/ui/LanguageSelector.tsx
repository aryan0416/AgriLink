"use client";

import { useLanguageStore } from '@/lib/language-store';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-emerald-900/10 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer">
        <Globe className="w-4 h-4 text-emerald-600" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
          className="appearance-none bg-transparent text-sm font-medium text-emerald-900 outline-none cursor-pointer pr-4"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </div>
    </div>
  );
}
