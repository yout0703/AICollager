import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { locales } from "@/lib/config";
import { Locale } from "@/lib/i18n";

// 语言名称映射，使用本地语言名称
const languageNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  ko: "한국어"
};

type LanguageSwitcherProps = {
  locale: Locale;
  pathnameWithoutLocale: string;
};

export default function LanguageSwitcher({ locale, pathnameWithoutLocale }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 关闭下拉菜单的函数
  const closeDropdown = () => {
    setIsOpen(false);
  };

  // 点击外部时关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary px-3 py-2 rounded-md hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-6 h-4 relative overflow-hidden rounded-sm shadow-sm border border-gray-200">
          <img 
            src={`/flags/${locale}.svg`}
            alt={languageNames[locale]}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <span>{locale.toUpperCase()}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-1 z-50">
          <div className="py-1">
            {locales.map((l) => (
              <Link
                key={l}
                href={`/${l}${pathnameWithoutLocale}`}
                className={`flex items-center space-x-3 px-4 py-2 text-sm rounded-md ${
                  l === locale 
                    ? 'bg-gray-100 text-primary font-medium' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                }`}
                onClick={closeDropdown}
              >
                <div className="w-6 h-4 relative overflow-hidden rounded-sm shadow-sm border border-gray-200">
                  <img 
                    src={`/flags/${l}.svg`}
                    alt={languageNames[l]}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <span>{languageNames[l]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 