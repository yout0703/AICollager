import { getDictionary, getTranslation, Locale } from "@/lib/i18n";
import ClientCollageCreator from "./ClientCollageCreator";

export default async function CollagePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = (key: string): string => getTranslation(dict, key);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-primary mb-8">
        {t('collageButton')}
      </h1>
      <ClientCollageCreator dict={dict} locale={locale} />
    </div>
  );
} 