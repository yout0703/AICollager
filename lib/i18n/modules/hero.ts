import type { locales } from "../../config";

type Locale = (typeof locales)[number];

export const heroTranslations: Record<Locale, any> = {
  en: {
    hero: {
      title: {
        highlight: "One-Click Generate",
        main: "Beautiful Photo Collages"
      },
      subtitle: "Say goodbye to tedious manual operations. AI intelligently analyzes your photo content and automatically generates the best layout and decorative effects.",
      features: {
        aiLayout: "AI Smart Layout",
        oneClick: "One-Click Generate",
        freeTrial: "Free Trial 3 Times"
      },
      cta: {
        primary: "Start Free Trial Now",
        secondary: "Watch Demo"
      },
      freeTrialNotice: "🎉 Free trial 3 times, no registration required, experience AI magic instantly",
      stats: {
        users: {
          number: "50K+",
          label: "Active Users"
        },
        rating: {
          number: "4.9",
          label: "User Rating"
        },
        collages: {
          number: "1M+",
          label: "Collage Works"
        },
        satisfaction: {
          number: "99%",
          label: "Satisfaction"
        }
      },
      inviteButton: {
        text: "Invite Friends for Credits",
        reward: "+20"
      },
      sample: {
        label: "AI-generated realistic collage sample",
        badge: "Sample",
        details: ["4 photos", "Smart layout", "Ready to export"]
      }
    }
  },

  zh: {
    hero: {
      title: {
        highlight: "一键生成",
        main: "精美照片拼图"
      },
      subtitle: "告别繁琐的手动操作，AI智能分析你的照片内容，自动生成最佳布局和装饰效果",
      features: {
        aiLayout: "AI智能布局",
        oneClick: "一键生成",
        freeTrial: "免费试用3次"
      },
      cta: {
        primary: "立即免费体验",
        secondary: "观看演示"
      },
      freeTrialNotice: "🎉 免费试用 3 次，无需注册，立即体验AI魔法",
      stats: {
        users: {
          number: "50K+",
          label: "活跃用户"
        },
        rating: {
          number: "4.9",
          label: "用户评分"
        },
        collages: {
          number: "1M+",
          label: "拼图作品"
        },
        satisfaction: {
          number: "99%",
          label: "满意度"
        }
      },
      inviteButton: {
        text: "邀请好友得积分",
        reward: "+20"
      },
      sample: {
        label: "AI 生成的真实拼贴案例",
        badge: "案例",
        details: ["4 张照片", "智能布局", "可直接导出"]
      }
    }
  },

  // 其他语言的简化版本
  es: {},
  fr: {},
  de: {},
  ja: {},
  ko: {}
};
