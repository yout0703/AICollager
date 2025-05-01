import LocaleNav from "@/components/header/LocaleNav";
import Footer from "@/components/footer";
import { getDictionary, Locale } from "@/lib/i18n";

export default async function DefaultLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-col min-h-screen">
      <LocaleNav dict={dict} locale={locale} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
} 