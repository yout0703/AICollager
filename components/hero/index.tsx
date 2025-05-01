import Link from "next/link";
import { Dictionary } from "@/lib/i18n";

interface HeroProps {
  dict: Dictionary;
  locale: string;
  t: (key: string) => string;
}

export default function Hero({ t, locale }: HeroProps) {
  return (
    <section className="text-center mb-16 relative">
      {/* 装饰性元素 - 左侧曲线线条 */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-0 hidden md:block">
        <svg width="120" height="180" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 10C30 40 100 80 20 120 C-10 140 60 160 110 150" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="10" r="8" fill="#FDA4AF" />
          <circle cx="110" cy="150" r="8" fill="#FDA4AF" />
        </svg>
      </div>

      {/* 装饰性元素 - 右侧圆点 */}
      <div className="absolute right-0 bottom-0 z-0 hidden md:block">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="40" fill="#FEE2E2" fillOpacity="0.6" />
          <circle cx="40" cy="40" r="25" stroke="#E11D48" strokeWidth="2" strokeDasharray="6 3" />
        </svg>
      </div>

      {/* 装饰性元素 - 右上角小型装饰 */}
      <div className="absolute right-10 top-0 z-0 hidden md:block">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 30C10 40 30 50 50 30" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="30" r="6" fill="#FDA4AF" />
        </svg>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4 relative z-10">
        {t('appName')}
      </h1>
      <h2 className="text-2xl md:text-4xl text-secondary-foreground mb-8 relative z-10">
        {t('tagline')}
      </h2>
      <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-8 relative z-10">
        {t('description')}
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
        <Link
          href={`/${locale}/collage`}
          className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg shadow-md flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v7H4V5zm0 9v1h12v-1H4z" clipRule="evenodd" />
          </svg>
          {t('collageButton')}
        </Link>
        <Link
          href={`/${locale}/pricing`}
          className="border border-primary text-primary hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg shadow-sm flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {t('pricing.title')}
        </Link>
      </div>
    </section>
  );
}
