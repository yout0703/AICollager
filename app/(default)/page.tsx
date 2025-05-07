import Covers from "@/components/covers";
import Hero from "@/components/hero";
import Input from "@/components/input";
import { getDictionary, Locale, getTranslation } from "@/lib/i18n";

export default function () {
  // 使用英语作为默认语言
  const locale = "en";
  const dict = getDictionary(locale as Locale);
  
  // 辅助函数获取翻译
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  return (
    <div className="w-full px-6">
      <Hero dict={dict} locale={locale} t={t} />
      <Input />
      <Covers />
    </div>
  );
}
