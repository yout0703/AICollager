'use client';

import React, { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Dictionary, getTranslation, getTranslationArray } from "@/lib/i18n";
import { Sparkles, Users, Zap, ArrowRight, Star, Check } from "lucide-react";
import { InviteModal } from "@/components/invite/InviteModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeroProps {
  dict: Dictionary;
  locale: string;
}

const Hero = ({ dict, locale }: HeroProps) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { isSignedIn } = useUser();

  // 在组件内部创建 t 函数
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const sampleDetails = getTranslationArray(dict, 'hero.sample.details');

  // 构建正确的链接
  const getCreateLink = () => {
    if (isSignedIn) {
      return `/${locale}/collage`;
    } else {
      // 如果未登录，重定向到登录页面，并设置回调URL
      const returnUrl = encodeURIComponent(`/${locale}/collage`);
      return `/${locale}/sign-in?returnUrl=${returnUrl}`;
    }
  };

  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 subtle-grid opacity-60" />
        <div className="relative mx-auto grid min-h-[calc(100vh-40px)] max-w-7xl grid-cols-1 gap-12 px-4 pb-16 pt-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-center lg:gap-10 lg:px-8 xl:gap-16">
          <div className="max-w-3xl">
            <Badge variant="soft" className="mb-6 gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {t('tagline')}
            </Badge>

            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-foreground md:text-6xl lg:text-7xl">
              <span className="text-primary">{t('hero.title.highlight')}</span>
              <br />
              {t('hero.title.main')}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {[t('hero.features.aiLayout'), t('hero.features.oneClick'), t('hero.features.freeTrial')].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="group">
                <Link href={getCreateLink()}>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {t('hero.cta.primary')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline">
                <Link href={`/${locale}/gallery`}>
                  {t('hero.cta.secondary')}
                </Link>
              </Button>
            </div>

            <div className="mt-6 inline-flex items-center rounded-md border border-accent/20 bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
              <Zap className="mr-2 h-4 w-4" />
              {t('hero.freeTrialNotice')}
            </div>

            <div className="mt-14 grid max-w-3xl grid-cols-2 gap-6 border-t border-border pt-8 md:grid-cols-4">
              {[
                [t('hero.stats.users.number'), t('hero.stats.users.label')],
                [t('hero.stats.rating.number'), t('hero.stats.rating.label')],
                [t('hero.stats.collages.number'), t('hero.stats.collages.label')],
                [t('hero.stats.satisfaction.number'), t('hero.stats.satisfaction.label')],
              ].map(([number, label], index) => (
                <div key={label}>
                  <div className="flex items-center gap-2 text-2xl font-semibold text-foreground md:text-3xl">
                    {number}
                    {index === 1 && <Star className="h-5 w-5 fill-accent text-accent" />}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full max-w-[520px] justify-self-center lg:self-center">
            <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="rounded-md border border-border bg-secondary/60 p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">AICollager</div>
                    <div className="text-xs text-muted-foreground">{t('hero.sample.label')}</div>
                  </div>
                  <Badge variant="accent">{t('hero.sample.badge')}</Badge>
                </div>

                <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-background">
                  <Image
                    src="/images/hero-collage-sample.png"
                    alt="AICollager AI collage example"
                    fill
                    priority
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="object-cover"
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {sampleDetails.map((label) => (
                    <div key={label} className="rounded-md border border-border bg-background px-3 py-2 text-center font-medium text-muted-foreground">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <button
            onClick={() => setShowInviteModal(true)}
            className="group flex items-center rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('hero.inviteButton.text')}
            <div className="ml-2 rounded bg-primary/10 px-2 py-1 text-xs text-primary">
              {t('hero.inviteButton.reward')}
            </div>
          </button>
        </div>
      </section>

      {/* 邀请弹窗 */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        locale={locale}
      />
    </>
  );
};

Hero.displayName = 'Hero';

export default Hero;
