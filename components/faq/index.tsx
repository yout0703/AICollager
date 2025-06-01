'use client';

import React, { useState } from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Clock,
  CreditCard,
  Download,
  Shield,
  Users,
  Settings
} from "lucide-react";

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
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-6">
            <HelpCircle className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              {t('faq.tagline')}
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('faq.title')}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}{t('faq.subtitle')}
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('faq.description')}
          </p>
        </div>

        {/* FAQ内容 */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => {
            const CategoryIcon = category.icon;
            return (
              <div key={categoryIndex} className="bg-gray-50 rounded-2xl p-6">
                {/* 分类标题 */}
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-4">
                    <CategoryIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {category.category}
                  </h3>
                </div>

                {/* 问题列表 */}
                <div className="space-y-4">
                  {category.questions.map((faq, questionIndex) => {
                    const index = categoryIndex * 1000 + questionIndex;
                    const isOpen = openIndex === index;
                    
                    return (
                      <div
                        key={questionIndex}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                      >
                        {/* 问题标题 */}
                        <button
                          onClick={() => toggleFAQ(categoryIndex, questionIndex)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>

                        {/* 答案内容 */}
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <div className="border-t border-gray-100 pt-4">
                              <p className="text-gray-600 leading-relaxed">
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

        {/* 底部联系信息 */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('faq.contact.title')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('faq.contact.description')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                <HelpCircle className="w-5 h-5 mr-2" />
                {t('faq.contact.contactSupport')}
              </button>
              <button className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-3 rounded-xl border border-gray-200 transition-all duration-300 shadow-md hover:shadow-lg">
                <Users className="w-5 h-5 mr-2" />
                {t('faq.contact.joinCommunity')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ; 