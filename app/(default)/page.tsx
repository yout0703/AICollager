import Hero from "@/components/hero";
import { getDictionary, Locale } from "@/lib/i18n";

function DefaultHomePage() {
  // 使用英语作为默认语言
  const locale = "en";
  const dict = getDictionary(locale as Locale);

  return (
    <div className="w-full px-6">
      <Hero dict={dict} locale={locale} />
      {/* TODO: 这里将来会替换为拼图创建组件 */}
    </div>
  );
}

DefaultHomePage.displayName = "DefaultHomePage";

export default DefaultHomePage;
