import React from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import {
  Sparkles,
  Zap,
  Palette,
  Download,
  Clock,
  Wand2,
  Image,
  Layout,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionHeader, SectionInner } from "@/components/ui/section";

interface FeaturesProps {
  dict: Dictionary;
}

const Features = ({ dict }: FeaturesProps) => {
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const features = [
    {
      icon: Sparkles,
      title: t('features.aiAnalysis.title'),
      description: t('features.aiAnalysis.description'),
    },
    {
      icon: Zap,
      title: t('features.oneClick.title'),
      description: t('features.oneClick.description'),
    },
    {
      icon: Palette,
      title: t('features.smartColor.title'),
      description: t('features.smartColor.description'),
    },
    {
      icon: Layout,
      title: t('features.multiLayout.title'),
      description: t('features.multiLayout.description'),
    },
    {
      icon: Wand2,
      title: t('features.smartDecoration.title'),
      description: t('features.smartDecoration.description'),
    },
    {
      icon: Download,
      title: t('features.hdDownload.title'),
      description: t('features.hdDownload.description'),
    }
  ];

  const stats = [
    { number: t('features.stats.avgTimeValue'), label: t('features.stats.avgTime'), icon: Clock },
    { number: "20+", label: t('features.stats.layoutTemplates'), icon: Layout },
    { number: "1000+", label: t('features.stats.decorativeIcons'), icon: Star },
    { number: "4K", label: t('features.stats.hdOutput'), icon: Image }
  ];

  return (
    <Section>
      <SectionInner>
        <SectionHeader>
          <Badge variant="soft" className="mb-5 gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            {t('features.title')}
          </Badge>

          <h2 className="text-3xl font-semibold tracking-normal text-foreground md:text-5xl">
            {t('features.subtitle')} <span className="text-primary">{t('features.highlight')}</span>
          </h2>

          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {t('features.description')}
          </p>
        </SectionHeader>

        <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={index}
                className="transition-colors hover:border-primary/30"
              >
                <CardHeader>
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-7 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg border border-border bg-secondary/60 p-8 md:p-10">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-semibold text-foreground md:text-3xl">
              {t('features.stats.title')}
            </h3>
            <p className="mt-3 text-muted-foreground">
              {t('features.stats.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mb-1 text-2xl font-semibold text-foreground md:text-3xl">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionInner>
    </Section>
  );
};

export default Features;
