import { getDictionary, Locale } from "@/lib/i18n";
import ClientCollageCreator from "./ClientCollageCreator";

export default async function CollagePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  // 全屏沉浸式编辑器：去掉 max-width 与外边距，让 workspace 占满视口。
  return <ClientCollageCreator dict={dict} locale={locale} />;
}
