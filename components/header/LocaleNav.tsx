"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { ClerkProvider } from "@clerk/nextjs";
import { locales } from "@/lib/config";
import { Locale, Dictionary, getTranslation } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import Image from "next/image";

export default function LocaleNav({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
    >
      <LocaleNavContent dict={dict} locale={locale} />
    </ClerkProvider>
  );
}

function LocaleNavContent({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 切换移动菜单
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 获取非语言部分的路径
  const pathnameWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // 安全访问字典属性的辅助函数
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={`/${locale}`} className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  style={{ height: 'auto' }}
                  className="mr-2"
                />
                <span className="text-2xl font-bold text-primary">{t('appName')}</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href={`/${locale}`}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathnameWithoutLocale === '/'
                    ? 'border-primary text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathnameWithoutLocale === '/pricing'
                    ? 'border-primary text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t('nav.pricing')}
              </Link>
              <Link
                href={`/${locale}/collage`}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathnameWithoutLocale === '/collage'
                    ? 'border-primary text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t('collageButton')}
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <LanguageSwitcher locale={locale} pathnameWithoutLocale={pathnameWithoutLocale} />
            {isSignedIn ? (
              <UserButton afterSignOutUrl={`/${locale}`} />
            ) : (
              <div className="flex space-x-4">
                <Link
                  href={`/${locale}/sign-in`}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href={`/${locale}/sign-up`}
                  className="bg-primary text-white hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 移动菜单 */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href={`/${locale}`}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathnameWithoutLocale === '/'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathnameWithoutLocale === '/pricing'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t('nav.pricing')}
            </Link>
            <Link
              href={`/${locale}/collage`}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathnameWithoutLocale === '/collage'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t('collageButton')}
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              {isSignedIn ? (
                <div className="flex-shrink-0">
                  <UserButton afterSignOutUrl={`/${locale}`} />
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link
                    href={`/${locale}/sign-in`}
                    className="block text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href={`/${locale}/sign-up`}
                    className="block bg-primary text-white hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('nav.signUp')}
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-3 px-2 space-y-1">
              <div className="flex flex-col p-2 space-y-1">
                {locales.map((l) => (
                  <Link
                    key={l}
                    href={`/${l}${pathnameWithoutLocale}`}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md ${
                      l === locale ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-6 h-4 relative overflow-hidden rounded-sm shadow-sm border border-gray-200">
                      <img
                        src={`/flags/${l}.svg`}
                        alt={l}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <span>
                      {l === 'en' && 'English'}
                      {l === 'zh' && '中文'}
                      {l === 'es' && 'Español'}
                      {l === 'fr' && 'Français'}
                      {l === 'de' && 'Deutsch'}
                      {l === 'ja' && '日本語'}
                      {l === 'ko' && '한국어'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}