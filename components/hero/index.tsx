'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { Dictionary, getTranslation } from "@/lib/i18n";
import { Sparkles, Users, Zap, ArrowRight, Play, Star, Check } from "lucide-react";
import { InviteModal } from "@/components/invite/InviteModal";

interface HeroProps {
  dict: Dictionary;
  locale: string;
}

const Hero = ({ dict, locale }: HeroProps) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // 在组件内部创建 t 函数
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  return (
    <>
      <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        {/* 背景装饰元素 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 网格背景 */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* 浮动装饰元素 */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          
          {/* 几何图形装饰 */}
          <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-blue-500 rotate-45 opacity-20"></div>
          <div className="absolute top-1/3 left-1/4 w-6 h-6 border-2 border-purple-500 rounded-full opacity-20"></div>
          <div className="absolute bottom-1/4 right-1/3 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* 产品标签 */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-8">
              <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">
                {t('tagline')}
              </span>
            </div>

            {/* 主标题 */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('hero.title.highlight')}
              </span>
              <br />
              {t('hero.title.main')}
            </h1>

            {/* 副标题 */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* 核心价值点 */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span>{t('hero.features.aiLayout')}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span>{t('hero.features.oneClick')}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <span>{t('hero.features.freeTrial')}</span>
              </div>
            </div>

            {/* 主要行动按钮 */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                href={`/${locale}/create`}
                className="group inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('hero.cta.primary')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="group inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-4 rounded-xl border border-gray-200 transition-all duration-300 shadow-md hover:shadow-lg text-lg">
                <Play className="w-5 h-5 mr-2" />
                {t('hero.cta.secondary')}
              </button>
            </div>

            {/* 免费试用提示 */}
            <div className="inline-flex items-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-6 py-3 mb-16">
              <Zap className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-700 font-medium">
                {t('hero.freeTrialNotice')}
              </span>
            </div>

            {/* 社会证明数据 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t('hero.stats.users.number')}</div>
                <div className="text-sm text-gray-600">{t('hero.stats.users.label')}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">{t('hero.stats.rating.number')}</span>
                  <div className="flex ml-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-600">{t('hero.stats.rating.label')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t('hero.stats.collages.number')}</div>
                <div className="text-sm text-gray-600">{t('hero.stats.collages.label')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t('hero.stats.satisfaction.number')}</div>
                <div className="text-sm text-gray-600">{t('hero.stats.satisfaction.label')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 邀请获得积分按钮 - 浮动在右下角 */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowInviteModal(true)}
            className="group bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('hero.inviteButton.text')}
            <div className="ml-2 bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs">
              {t('hero.inviteButton.reward')}
            </div>
          </button>
        </div>

        {/* 底部波浪装饰 */}
        <div className="absolute bottom-0 left-0 right-0 h-24">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-full">
            <path
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
              fill="white"
            />
          </svg>
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
