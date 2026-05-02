import React from 'react';
import { Dictionary } from "@/lib/i18n";
import { Star, Quote, Heart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Section, SectionHeader, SectionInner } from "@/components/ui/section";

interface TestimonialsProps {
  dict: Dictionary;
}

const Testimonials = ({}: TestimonialsProps) => {
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
    <Section>
      <SectionInner>
        <SectionHeader>
          <Badge variant="soft" className="mb-5 gap-2">
            <Heart className="h-3.5 w-3.5" />
            用户评价
          </Badge>

          <h2 className="text-3xl font-semibold tracking-normal text-foreground md:text-5xl">
            用户都在说 <span className="text-primary">好话</span>
          </h2>

          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            来自真实用户的反馈，看看AI拼图如何改变了他们的创作体验
          </p>
        </SectionHeader>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-md mb-4">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* 评价网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="relative"
            >
              <CardContent className="p-8">
              {/* 引用图标 */}
              <div className="absolute top-6 right-6 w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                <Quote className="w-4 h-4 text-primary" />
              </div>

              {/* 评分 */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-accent fill-current" />
                ))}
              </div>

              {/* 评价内容 */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* 亮点标签 */}
              <Badge variant="accent" className="mb-6">{testimonial.highlight}</Badge>

              {/* 用户信息 */}
              <div className="flex items-center">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>

              {/* 效果对比 */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">效果对比</div>
                <div className="text-sm font-medium text-primary">
                  {testimonial.beforeAfter}
                </div>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 底部CTA */}
        <div className="text-center mt-16">
          <div className="bg-secondary/60 rounded-lg p-8 border border-border">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              加入50,000+满意用户的行列
            </h3>
            <p className="text-muted-foreground mb-6">
              开始你的AI拼图创作之旅，体验前所未有的简单和智能
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button>
                <Sparkles className="w-5 h-5 mr-2" />
                立即免费体验
              </Button>
              <Button variant="outline">
                <Heart className="w-5 h-5 mr-2" />
                查看更多评价
              </Button>
            </div>
          </div>
        </div>
      </SectionInner>
    </Section>
  );
};

export default Testimonials;
