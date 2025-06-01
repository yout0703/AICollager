# 国际化 (i18n) 最佳实践

## 📂 模块化结构

### 优点
- **可维护性提升**：每个模块独立维护，避免单文件过大
- **团队协作友好**：不同开发者可以并行编辑不同模块
- **懒加载支持**：可按需加载特定模块的翻译
- **版本控制友好**：git diff 更清晰，冲突更少

### 文件结构
```
lib/i18n/
├── index.ts              # 主入口文件，合并所有模块
├── modules/              # 翻译模块目录
│   ├── common.ts        # 通用翻译（按钮、错误消息等）
│   ├── hero.ts          # 主页Hero部分
│   ├── features.ts      # 功能介绍部分
│   ├── howItWorks.ts    # 使用流程部分
│   ├── pricing.ts       # 定价部分
│   ├── faq.ts           # FAQ部分
│   └── cta.ts           # CTA部分
└── README.md            # 本文档
```

## 🎯 最佳实践指南

### 1. 避免过度插值 (Interpolation)
❌ **不好的做法**：
```typescript
// 这种方式在不同语言中会导致语法错误
const message = t('addedOn') + ': ' + date; // "Added: January 1"
```

✅ **正确做法**：
```typescript
// 将整个句子作为一个翻译单元
const message = t('addedOnDate', { date }); // "Added: {{date}}"
```

### 2. 使用完整句子，避免文本片段
❌ **不好的做法**：
```typescript
// 语序在不同语言中可能不同
{t('learn')} {t('more')} {t('about')} {linkText}
```

✅ **正确做法**：
```typescript
// 使用完整句子，允许不同语言调整语序
t('learnMoreAbout', { linkText })
```

### 3. 考虑语法变化
不同语言有复杂的语法规则：
- **复数形式**：英语简单的 singular/plural，但其他语言可能有 3-6 种复数形式
- **性别变化**：德语、法语等语言中名词有性别变化
- **格变**：俄语、芬兰语等语言有复杂的格变系统
- **语序**：不同语言的主谓宾语序不同

### 4. 模块分离原则
按照**功能域**而不是**组件**来分离翻译：

✅ **按功能域分离**：
- `hero.ts` - 首页主视觉区域
- `features.ts` - 功能介绍
- `pricing.ts` - 定价相关
- `common.ts` - 通用元素

❌ **按组件分离**：
- `button.ts` - 按钮文本
- `modal.ts` - 弹窗文本

### 5. 命名规范
使用有意义的层级结构：

```typescript
// 好的命名
features.aiAnalysis.title
pricing.basicPackage.features

// 避免过深的嵌套
data.user.profile.personal.contact.email.validation.error
```

## 🔧 使用方法

### 1. 添加新翻译
在对应的模块文件中添加翻译键值对：

```typescript
// lib/i18n/modules/features.ts
export const featuresTranslations = {
  en: {
    features: {
      newFeature: {
        title: "New Amazing Feature",
        description: "This feature will change everything"
      }
    }
  },
  zh: {
    features: {
      newFeature: {
        title: "全新神奇功能",
        description: "这个功能将改变一切"
      }
    }
  }
}
```

### 2. 在组件中使用
```typescript
import { Dictionary, getTranslation } from "@/lib/i18n";

const MyComponent = ({ dict }: { dict: Dictionary }) => {
  const t = (key: string) => getTranslation(dict, key);
  
  return (
    <div>
      <h2>{t('features.newFeature.title')}</h2>
      <p>{t('features.newFeature.description')}</p>
    </div>
  );
};
```

## 📚 参考资源

- [i18next 最佳实践](https://www.i18next.com/principles/best-practices)
- [Shopify i18n 指南](https://shopify.engineering/internationalization-i18n-best-practices-front-end-developers)
- [Unicode CLDR](http://cldr.unicode.org/) - 国际化数据标准

## 🚀 迁移指南

从单文件迁移到模块化结构：

1. **备份原文件**：`mv lib/i18n.ts lib/i18n.ts.backup`
2. **创建模块目录**：`mkdir lib/i18n/modules`
3. **按功能拆分翻译**：将大字典拆分为功能模块
4. **更新导入路径**：将组件中的导入路径更新为新的模块化结构
5. **测试验证**：确保所有翻译键都能正确访问

## 💡 高级优化

### 1. 懒加载翻译
```typescript
// 动态导入特定模块
const loadPricingTranslations = () => import('./modules/pricing');
```

### 2. 翻译键类型安全
```typescript
// 使用 TypeScript 模板字面量类型
type TranslationKey = 'features.title' | 'pricing.basic.title' | ...;
```

### 3. 翻译覆盖率检查
```bash
# 检查缺失的翻译
npm run i18n:check-coverage
``` 