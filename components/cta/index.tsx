import Link from "next/link";
import { Dictionary, getTranslation } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionInner } from "@/components/ui/section";

interface CTAProps {
  dict: Dictionary;
  locale: string;
}

export default function CTA({ dict, locale }: CTAProps) {
  // 在组件内部创建 t 函数
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  return (
    <Section className="pt-0">
      <SectionInner>
        <div className="rounded-lg border border-border bg-primary px-6 py-12 text-center text-primary-foreground md:px-12">
          <h2 className="text-3xl font-semibold tracking-normal md:text-4xl">
            {t('cta.title')}
          </h2>
          <p className="mx-auto mb-8 mt-4 max-w-2xl text-lg text-primary-foreground/85">
            {t('cta.description')}
          </p>
          <Button asChild size="lg" variant="secondary" className="group">
            <Link href={`/${locale}/collage`}>
              {t('collageButton')}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </SectionInner>
    </Section>
  );
}
