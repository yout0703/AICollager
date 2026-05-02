import React from 'react';
import { Dictionary, getTranslation, getTranslationArray } from "@/lib/i18n";
import {
  Sparkles,
  Check,
  Star,
  Zap,
  Crown,
  Gift,
  Users,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionHeader, SectionInner } from "@/components/ui/section";

interface PricingPreviewProps {
  dict: Dictionary;
  locale: string;
}

const PricingPreview = ({ dict, locale }: PricingPreviewProps) => {
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const plans = [
    {
      name: t('pricingSection.freePackage.name'),
      price: t('pricingSection.freePackage.price'),
      credits: t('pricingSection.freePackage.credits'),
      description: t('pricingSection.freePackage.description'),
      features: getTranslationArray(dict, 'pricingSection.freePackage.features'),
      buttonText: t('pricingSection.freePackage.buttonText'),
      popular: false,
      icon: Gift
    },
    {
      name: t('pricingSection.basicPackage.name'),
      price: t('pricingSection.basicPackage.price'),
      credits: t('pricingSection.basicPackage.credits'),
      description: t('pricingSection.basicPackage.description'),
      features: getTranslationArray(dict, 'pricingSection.basicPackage.features'),
      buttonText: t('pricingSection.basicPackage.buttonText'),
      popular: true,
      icon: Star
    },
    {
      name: t('pricingSection.proPackage.name'),
      price: t('pricingSection.proPackage.price'),
      credits: t('pricingSection.proPackage.credits'),
      description: t('pricingSection.proPackage.description'),
      features: getTranslationArray(dict, 'pricingSection.proPackage.features'),
      buttonText: t('pricingSection.proPackage.buttonText'),
      popular: false,
      icon: Crown
    }
  ];

  const bonusFeatures = [
    {
      icon: Users,
      title: t('pricingSection.bonusFeatures.inviteReward.title'),
      description: t('pricingSection.bonusFeatures.inviteReward.description'),
      highlight: t('pricingSection.bonusFeatures.inviteReward.highlight')
    },
    {
      icon: Zap,
      title: t('pricingSection.bonusFeatures.creditsNeverExpire.title'),
      description: t('pricingSection.bonusFeatures.creditsNeverExpire.description'),
      highlight: t('pricingSection.bonusFeatures.creditsNeverExpire.highlight')
    },
    {
      icon: Sparkles,
      title: t('pricingSection.bonusFeatures.aiUpgrades.title'),
      description: t('pricingSection.bonusFeatures.aiUpgrades.description'),
      highlight: t('pricingSection.bonusFeatures.aiUpgrades.highlight')
    }
  ];

  const getUnitPrice = (price: string, credits: string) => {
    const priceValue = Number(price.replace(/[^0-9.]/g, ''));
    const creditsValue = Number(credits.replace(/[^0-9.]/g, ''));

    if (!priceValue || !creditsValue) {
      return null;
    }

    return (priceValue / (creditsValue / 5)).toFixed(1);
  };

  return (
    <Section>
      <SectionInner>
        <SectionHeader>
          <Badge variant="soft" className="mb-5 gap-2">
            <Crown className="h-3.5 w-3.5" />
            {t('pricingSection.tagline')}
          </Badge>

          <h2 className="text-3xl font-semibold tracking-normal text-foreground md:text-5xl">
            {t('pricingSection.subtitle')} <span className="text-primary">{t('pricingSection.highlight')}</span>
          </h2>

          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {t('pricingSection.description')}
          </p>
        </SectionHeader>

        <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card
                key={index}
                className={`relative ${plan.popular ? 'border-primary ring-1 ring-primary/20' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {t('pricingSection.popularLabel')}
                  </Badge>
                )}

                <CardHeader>
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline">
                    <span className="text-4xl font-semibold text-foreground">
                      {plan.price}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      / {plan.credits}
                    </span>
                    </div>
                    {index > 0 && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {t('pricingSection.unitPricePrefix')} {plan.price[0]}
                        {getUnitPrice(plan.price, plan.credits)} {t('pricingSection.unitPriceSuffix')}
                      </div>
                    )}
                  </div>

                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-muted-foreground">
                        <Check className="mr-3 h-4 w-4 flex-shrink-0 text-accent" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    <Link href={`/${locale}/pricing`}>
                      {plan.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg border border-border bg-secondary/60 p-8">
          <h3 className="mb-8 text-center text-2xl font-semibold text-foreground">
            {t('pricingSection.bonusFeatures.title')}
          </h3>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {bonusFeatures.map((feature: any, index: number) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h4>
                  <p className="mb-3 text-muted-foreground">
                    {feature.description}
                  </p>
                  <Badge variant="accent">{feature.highlight}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t('pricingSection.bottomNotice')}
          </p>
        </div>
      </SectionInner>
    </Section>
  );
};

export default PricingPreview;
