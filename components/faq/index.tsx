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
  Users
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
      category: "基础使用",
      icon: Sparkles,
      questions: [
        {
          question: "什么是AI Collager？",
          answer: "AI Collager是一款基于人工智能的智能拼图工具。它能自动分析你的照片内容、色彩和构图，然后生成最佳的拼图布局和装饰效果，让你无需设计经验就能创作出专业级的照片拼图作品。"
        },
        {
          question: "如何开始使用？",
          answer: "非常简单！新用户可以免费试用3次，无需注册。只需上传2-20张照片，AI会自动分析并生成精美的拼图。如果满意效果，可以注册账户获得更多积分继续使用。"
        },
        {
          question: "支持哪些图片格式？",
          answer: "我们支持常见的图片格式，包括JPG、JPEG、PNG、WebP等。建议上传高质量的图片以获得最佳效果。单张图片大小建议不超过10MB。"
        }
      ]
    },
    {
      category: "积分系统",
      icon: CreditCard,
      questions: [
        {
          question: "积分系统是如何工作的？",
          answer: "每制作一个拼图消耗5积分。新用户注册即获得50积分，邀请好友注册可获得20积分奖励。积分永不过期，可随时使用。这种按需付费的模式让你只为实际使用的功能付费。"
        },
        {
          question: "如何获得更多积分？",
          answer: "有多种方式获得积分：1) 购买积分套餐；2) 邀请好友注册获得20积分；3) 参与平台活动；4) 关注我们的社交媒体获得不定期奖励。"
        },
        {
          question: "积分会过期吗？",
          answer: "不会！购买的积分永久有效，没有使用期限。你可以根据自己的需要随时使用，非常灵活。"
        }
      ]
    },
    {
      category: "功能特性",
      icon: Clock,
      questions: [
        {
          question: "AI生成需要多长时间？",
          answer: "通常只需要5-15秒！我们的AI算法经过优化，能够快速分析照片并生成拼图。具体时间取决于照片数量和复杂度，但绝大多数情况下都能在30秒内完成。"
        },
        {
          question: "可以自定义拼图样式吗？",
          answer: "当然可以！虽然AI会自动生成最佳方案，但你可以选择不同的布局风格、调整间距、更换装饰元素等。我们提供了丰富的自定义选项，让你的作品更加个性化。"
        },
        {
          question: "支持多少张照片拼图？",
          answer: "支持2-20张照片的拼图制作。AI会根据照片数量自动选择最合适的布局方案，确保每张照片都能得到合适的展示空间。"
        }
      ]
    },
    {
      category: "下载与分享",
      icon: Download,
      questions: [
        {
          question: "支持哪些下载格式和尺寸？",
          answer: "支持JPG和PNG格式下载。提供多种尺寸选择：社交媒体尺寸(1080x1080)、打印尺寸(3000x3000)、4K高清(3840x3840)等。付费用户可下载无水印的高清版本。"
        },
        {
          question: "可以商用吗？",
          answer: "个人用户可以自由使用生成的拼图。如需商业用途，请查看我们的商业授权条款或联系客服了解企业套餐。我们提供灵活的授权方案满足不同需求。"
        }
      ]
    },
    {
      category: "技术支持",
      icon: Shield,
      questions: [
        {
          question: "遇到问题如何获得帮助？",
          answer: "我们提供多种支持方式：1) 在线帮助文档；2) 邮件客服支持；3) 社区论坛；4) 付费用户享有优先技术支持。通常在24小时内回复。"
        },
        {
          question: "数据安全如何保障？",
          answer: "我们非常重视用户隐私和数据安全。所有上传的照片都经过加密传输和存储，仅用于AI分析和拼图生成。我们不会保存或分享你的个人照片，处理完成后会自动删除。"
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
              常见问题
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            你想了解的
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}都在这里
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            快速找到你关心的问题答案，如果还有疑问，随时联系我们的客服团队
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
              还有其他问题？
            </h3>
            <p className="text-gray-600 mb-6">
              我们的客服团队随时为你提供帮助
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                <HelpCircle className="w-5 h-5 mr-2" />
                联系客服
              </button>
              <button className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-3 rounded-xl border border-gray-200 transition-all duration-300 shadow-md hover:shadow-lg">
                <Users className="w-5 h-5 mr-2" />
                加入社区
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ; 