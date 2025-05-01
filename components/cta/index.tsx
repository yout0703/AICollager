import Link from "next/link";
import { Dictionary } from "@/lib/i18n";

interface CTAProps {
  dict: Dictionary;
  locale: string;
  t: (key: string) => string;
}

export default function CTA({ t, locale }: CTAProps) {
  return (
    <section className="text-center bg-gradient-to-r from-primary/90 to-primary rounded-2xl p-12 text-white shadow-lg">
      <h2 className="text-3xl font-bold mb-4">
        立即开始创建精美照片拼图
      </h2>
      <p className="text-xl mb-8 max-w-2xl mx-auto">
        无需设计经验，简单几步即可创建专业水准的照片拼图
      </p>
      <Link
        href={`/${locale}/collage`}
        className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg shadow-md inline-flex items-center justify-center gap-2 text-lg"
      >
        {t('collageButton')}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </Link>
    </section>
  );
} 