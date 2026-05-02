'use client';

import React, { useState } from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CreditCard,
  Shield,
  Settings,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, SectionInner } from "@/components/ui/section";

interface FAQProps {
  dict: Dictionary;
}

const FAQ = ({ dict }: FAQProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const faqs = [
    {
      category: t('faq.categories.basic'),
      icon: Sparkles,
      questions: [
        {
          question: t('faq.basic.whatIs.question'),
          answer: t('faq.basic.whatIs.answer')
        },
        {
          question: t('faq.basic.howToStart.question'),
          answer: t('faq.basic.howToStart.answer')
        },
        {
          question: t('faq.basic.supportedFormats.question'),
          answer: t('faq.basic.supportedFormats.answer')
        }
      ]
    },
    {
      category: t('faq.categories.pricing'),
      icon: CreditCard,
      questions: [
        {
          question: t('faq.pricing.howCreditsWork.question'),
          answer: t('faq.pricing.howCreditsWork.answer')
        },
        {
          question: t('faq.pricing.freeTrials.question'),
          answer: t('faq.pricing.freeTrials.answer')
        },
        {
          question: t('faq.pricing.refundPolicy.question'),
          answer: t('faq.pricing.refundPolicy.answer')
        }
      ]
    },
    {
      category: t('faq.categories.technical'),
      icon: Settings,
      questions: [
        {
          question: t('faq.technical.processingTime.question'),
          answer: t('faq.technical.processingTime.answer')
        },
        {
          question: t('faq.technical.photoQuality.question'),
          answer: t('faq.technical.photoQuality.answer')
        },
        {
          question: t('faq.technical.browserSupport.question'),
          answer: t('faq.technical.browserSupport.answer')
        }
      ]
    },
    {
      category: t('faq.categories.account'),
      icon: Shield,
      questions: [
        {
          question: t('faq.account.dataSecurity.question'),
          answer: t('faq.account.dataSecurity.answer')
        },
        {
          question: t('faq.account.accountDeletion.question'),
          answer: t('faq.account.accountDeletion.answer')
        },
        {
          question: t('faq.account.changePassword.question'),
          answer: t('faq.account.changePassword.answer')
        }
      ]
    }
  ];

  const toggleFAQ = (categoryIndex: number, questionIndex: number) => {
    const index = categoryIndex * 1000 + questionIndex;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Section>
      <SectionInner className="max-w-4xl">
        <SectionHeader>
          <Badge variant="soft" className="mb-5 gap-2">
            <HelpCircle className="h-3.5 w-3.5" />
            {t('faq.tagline')}
          </Badge>

          <h2 className="text-3xl font-semibold tracking-normal text-foreground md:text-5xl">
            {t('faq.title')} <span className="text-primary">{t('faq.subtitle')}</span>
          </h2>

          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {t('faq.description')}
          </p>
        </SectionHeader>

        <div className="space-y-5">
          {faqs.map((category, categoryIndex) => {
            const CategoryIcon = category.icon;
            return (
              <div key={categoryIndex} className="rounded-lg border border-border bg-secondary/50 p-5">
                <div className="flex items-center mb-6">
                  <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {category.category}
                  </h3>
                </div>

                <div className="space-y-3">
                  {category.questions.map((faq, questionIndex) => {
                    const index = categoryIndex * 1000 + questionIndex;
                    const isOpen = openIndex === index;

                    return (
                      <div
                        key={questionIndex}
                        className="overflow-hidden rounded-md border border-border bg-background"
                      >
                        <button
                          onClick={() => toggleFAQ(categoryIndex, questionIndex)}
                          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-secondary"
                        >
                          <span className="pr-4 font-medium text-foreground">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-4">
                            <div className="border-t border-border pt-4">
                              <p className="leading-7 text-muted-foreground">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="rounded-lg border border-border bg-secondary/60 p-8">
            <h3 className="mb-4 text-2xl font-semibold text-foreground">
              {t('faq.contact.title')}
            </h3>
            <p className="mb-6 text-muted-foreground">
              {t('faq.contact.description')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button>
                <HelpCircle className="mr-2 h-5 w-5" />
                {t('faq.contact.contactSupport')}
              </Button>
              <Button variant="outline">
                <Users className="mr-2 h-5 w-5" />
                {t('faq.contact.joinCommunity')}
              </Button>
            </div>
          </div>
        </div>
      </SectionInner>
    </Section>
  );
};

export default FAQ;
