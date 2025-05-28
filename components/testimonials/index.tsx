import React from 'react';
import { Dictionary, getTranslation } from "@/lib/i18n";
import { Star, Quote, Heart, Sparkles } from "lucide-react";

interface TestimonialsProps {
  dict: Dictionary;
}

const Testimonials = ({ dict }: TestimonialsProps) => {
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  const testimonials = [
    {
      id: 1,
      name: "张小美",
      role: "摄影爱好者",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      content: "太神奇了！以前制作拼图要花几个小时，现在AI几秒钟就能生成超美的效果。朋友们都问我是怎么做的，强烈推荐！",
      rating: 5,
      highlight: "节省时间",
      beforeAfter: "从几小时到几秒钟"
    },
    {
      id: 2,
      name: "李设计师",
      role: "平面设计师",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: "作为设计师，我对AI的布局和配色能力印象深刻。它能理解照片的情感和主题，生成的拼图比我手工做的还要和谐。",
      rating: 5,
      highlight: "专业认可",
      beforeAfter: "AI比手工更和谐"
    },
    {
      id: 3,
      name: "王妈妈",
      role: "家庭主妇",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      content: "给孩子做成长相册变得好简单！AI自动识别孩子的照片，还会添加可爱的装饰。孩子看到后超级开心！",
      rating: 5,
      highlight: "家庭回忆",
      beforeAfter: "孩子超级开心"
    },
    {
      id: 4,
      name: "陈创业者",
      role: "电商店主",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content: "用来制作产品展示图太棒了！AI能根据产品特点选择最佳布局，转化率提升了30%。这个工具是我的秘密武器。",
      rating: 5,
      highlight: "商业价值",
      beforeAfter: "转化率提升30%"
    },
    {
      id: 5,
      name: "刘旅行达人",
      role: "旅行博主",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      content: "每次旅行回来都有几百张照片，AI帮我快速制作精美的旅行拼图。粉丝们都说我的图片越来越专业了！",
      rating: 5,
      highlight: "内容创作",
      beforeAfter: "粉丝说越来越专业"
    },
    {
      id: 6,
      name: "赵学生",
      role: "大学生",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
      content: "做毕业纪念册的神器！AI能识别人脸，自动把同学们的照片排列得很有意思。免费试用就够我用了，太良心！",
      rating: 5,
      highlight: "学生友好",
      beforeAfter: "免费试用就够用"
    }
  ];

  const stats = [
    { number: "50,000+", label: "满意用户", icon: Heart },
    { number: "4.9/5", label: "用户评分", icon: Star },
    { number: "1,000,000+", label: "拼图作品", icon: Sparkles },
    { number: "99%", label: "推荐率", icon: Quote }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题部分 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-6">
            <Heart className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              用户评价
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            用户都在说
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}好话
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            来自真实用户的反馈，看看AI拼图如何改变了他们的创作体验
          </p>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-4">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* 评价网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* 引用图标 */}
              <div className="absolute top-6 right-6 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                <Quote className="w-4 h-4 text-white" />
              </div>

              {/* 评分 */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* 评价内容 */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* 亮点标签 */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 mb-6">
                <span className="text-xs font-medium text-green-700">
                  {testimonial.highlight}
                </span>
              </div>

              {/* 用户信息 */}
              <div className="flex items-center">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>

              {/* 效果对比 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">效果对比</div>
                <div className="text-sm font-medium text-blue-600">
                  {testimonial.beforeAfter}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              加入50,000+满意用户的行列
            </h3>
            <p className="text-gray-600 mb-6">
              开始你的AI拼图创作之旅，体验前所未有的简单和智能
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                <Sparkles className="w-5 h-5 mr-2" />
                立即免费体验
              </button>
              <button className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-3 rounded-xl border border-gray-200 transition-all duration-300 shadow-md hover:shadow-lg">
                <Heart className="w-5 h-5 mr-2" />
                查看更多评价
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 