import React from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import {
  Upload,
  Sparkles,
  Download,
  ArrowRight,
  Wand2,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionHeader, SectionInner } from "@/components/ui/section";

interface HowItWorksProps {
  dict: Dictionary;
  locale?: string;
}

const HowItWorks = ({ dict, locale = 'zh' }: HowItWorksProps) => {
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const steps = [
    {
      step: "01",
      icon: Upload,
      title: t('howItWorks.steps.upload.title'),
      description: t('howItWorks.steps.upload.description'),
      details: [
        t('howItWorks.steps.upload.details.batchUpload'),
        t('howItWorks.steps.upload.details.autoOptimize'),
        t('howItWorks.steps.upload.details.duplicateDetection')
      ],
    },
    {
      step: "02",
      icon: Sparkles,
      title: t('howItWorks.steps.analyze.title'),
      description: t('howItWorks.steps.analyze.description'),
      details: [
        t('howItWorks.steps.analyze.details.contentRecognition'),
        t('howItWorks.steps.analyze.details.colorMatching'),
        t('howItWorks.steps.analyze.details.layoutRecommendation')
      ],
    },
    {
      step: "03",
      icon: Wand2,
      title: t('howItWorks.steps.generate.title'),
      description: t('howItWorks.steps.generate.description'),
      details: [
        t('howItWorks.steps.generate.details.smartLayout'),
        t('howItWorks.steps.generate.details.autoDecoration'),
        t('howItWorks.steps.generate.details.realTimePreview')
      ],
    },
    {
      step: "04",
      icon: Download,
      title: t('howItWorks.steps.download.title'),
      description: t('howItWorks.steps.download.description'),
      details: [
        t('howItWorks.steps.download.details.multipleSizes'),
        t('howItWorks.steps.download.details.hdNoWatermark'),
        t('howItWorks.steps.download.details.oneClickShare')
      ],
    }
  ];

  return (
    <Section muted>
      <SectionInner>
        <SectionHeader>
          <Badge variant="soft" className="mb-5 gap-2">
            <Wand2 className="h-3.5 w-3.5" />
            {t('howItWorks.tagline')}
          </Badge>

          <h2 className="text-3xl font-semibold tracking-normal text-foreground md:text-5xl">
            {t('howItWorks.title')} <span className="text-primary">{t('howItWorks.highlight')}</span>{' '}
            {t('howItWorks.subtitle')} {t('howItWorks.titleSuffix')}
          </h2>

          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {t('howItWorks.description')}
          </p>
        </SectionHeader>

        <div className="relative isolate mb-16 lg:mb-20">
          <div className="absolute left-8 right-8 top-8 z-0 hidden h-px bg-border lg:block" />

          <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="relative flex flex-col">
                  <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-primary">
                    <IconComponent className="h-6 w-6" />
                  </div>

                  <Card className="flex h-full min-h-[330px] flex-col">
                    <CardHeader>
                      <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {step.step}
                      </div>
                      <CardTitle>{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="mb-6 leading-7 text-muted-foreground">
                        {step.description}
                      </p>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center text-sm text-muted-foreground">
                            <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-accent" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-background p-8">
            <h3 className="text-2xl font-semibold text-foreground">
              {t('howItWorks.cta.title')}
            </h3>
            <p className="mb-6 mt-3 text-muted-foreground">
              {t('howItWorks.cta.description')}
            </p>
            <Button asChild size="lg" className="group">
              <Link href={`/${locale}/collage`}>
                <Sparkles className="mr-2 h-5 w-5" />
                {t('howItWorks.cta.button')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </SectionInner>
    </Section>
  );
};

export default HowItWorks;
