import React from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import { 
  Upload, 
  Sparkles, 
  Download, 
  ArrowRight,
  Image,
  Wand2,
  CheckCircle
} from "lucide-react";

interface HowItWorksProps {
  dict: Dictionary;
}

const HowItWorks = ({ dict }: HowItWorksProps) => {
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
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50"
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
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50"
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
      color: "from-green-500 to-emerald-500", 
      bgColor: "bg-green-50"
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
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-6">
            <Wand2 className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              {t('howItWorks.tagline')}
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('howItWorks.title')}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}{t('howItWorks.highlight')}
            </span>
            {t('howItWorks.subtitle')}，创作精美拼图
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('howItWorks.description')}
          </p>
        </div>

        {/* 步骤展示 */}
        <div className="relative">
          {/* 连接线 - 桌面端 */}
          <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
            <div className="relative h-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-purple-200 via-green-200 to-orange-200 rounded-full"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500 rounded-full animate-pulse opacity-50"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="relative">
                  {/* 移动端连接线 */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden absolute top-32 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                  )}
                  
                  <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                    {/* 步骤编号 */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {step.step}
                    </div>
                    
                    {/* 图标 */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} mb-6 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* 内容 */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* 详细特性 */}
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('howItWorks.cta.title')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('howItWorks.cta.description')}
            </p>
            <button className="group inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              <Sparkles className="w-5 h-5 mr-2" />
              {t('howItWorks.cta.button')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 