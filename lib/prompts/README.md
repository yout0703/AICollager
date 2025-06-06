# AI Prompt 管理系统

本模块实现了企业级的 AI Prompt 管理最佳实践，解决了代码中 prompt 管理的可读性和维护性问题。

## 📋 **设计原则**

基于 [PromptLayer 最佳实践](https://medium.com/promptlayer/scalable-prompt-management-and-collaboration-fff28af39b9b) 和 [Atlassian AI Prompt 指南](https://www.atlassian.com/blog/announcements/best-practices-for-generating-ai-prompts)：

### 1. **解耦 Prompts 和代码**
- ✅ Prompts 存储在独立模块中
- ✅ 业务逻辑与 prompt 模板分离
- ✅ 支持动态参数注入

### 2. **模块化设计**
- ✅ 可复用的 prompt snippets
- ✅ 组合式 prompt 构建
- ✅ 统一的格式规范

### 3. **可维护性**
- ✅ 版本控制和变更追踪
- ✅ 集中化配置管理
- ✅ 类型安全的参数传递

## 📁 **文件结构**

```
lib/prompts/
├── README.md          # 本文档
├── templates.ts       # 核心 prompt 模板
├── config.ts         # 配置参数管理
└── (未来扩展)
    ├── snippets/     # 可复用的 prompt 片段
    ├── validators/   # 响应验证器
    └── cache/        # 缓存管理
```

## 🎯 **核心模块**

### `templates.ts` - Prompt 模板
- **COMMON_SNIPPETS**: 通用指令片段（JSON格式要求、语言设置等）
- **DESIGN_STYLE_SNIPPETS**: 设计风格定义
- **CREATIVITY_SNIPPETS**: 创意提示库
- **生成函数**: `generateImageAnalysisPrompt()`, `generateLayoutSuggestionPrompt()`, `generateColorSchemePrompt()`

### `config.ts` - 配置管理
- **IMAGE_ANALYSIS_CONFIG**: 图片分析相关参数
- **LAYOUT_DESIGN_CONFIG**: 布局设计配置
- **COLOR_SCHEME_CONFIG**: 配色方案设置
- **AI_MODEL_CONFIG**: AI 模型参数
- **响应验证配置**: 数据完整性检查

## 🚀 **使用方法**

### 基础用法

```typescript
import {
  generateImageAnalysisPrompt,
  generateLayoutSuggestionPrompt,
  generateColorSchemePrompt
} from '@/lib/prompts/templates';

// 图片分析
const analysisPrompt = generateImageAnalysisPrompt();

// 布局建议
const layoutPrompt = generateLayoutSuggestionPrompt({
  images: imageAnalysisResults,
  aspectRatio: '1:1',
  style: 'MODERN_CREATIVE',
  imageCount: 4
});

// 配色方案
const colorPrompt = generateColorSchemePrompt(
  dominantColors, 
  'modern', 
  'warm'
);
```

### 配置管理

```typescript
import { getPromptConfigSummary } from '@/lib/prompts/config';

// 获取当前配置摘要
const config = getPromptConfigSummary();
console.log('配置版本:', config.version);
```

## 📊 **版本控制**

每个 prompt 模板都包含版本信息：

```typescript
export const PROMPT_TEMPLATE_VERSION = {
  version: '1.0.0',
  lastUpdated: '2025-01-15',
  changelog: [
    '1.0.0 - 初始版本，解耦 prompts 到独立模块',
  ],
} as const;
```

## 🔧 **自定义和扩展**

### 添加新的 Prompt 模板

1. 在 `templates.ts` 中定义新的模板常量
2. 创建对应的生成函数
3. 在 `config.ts` 中添加相关配置
4. 更新版本信息和 changelog

### 添加新的 Snippet

```typescript
export const NEW_SNIPPETS = {
  CUSTOM_INSTRUCTION: '你的自定义指令...',
  ANOTHER_SNIPPET: (param: string) => `动态内容 ${param}`,
} as const;
```

## 📈 **性能优化**

### 缓存策略
- Prompt 模板在运行时生成
- 静态 snippets 使用 `as const` 优化
- 配置参数支持运行时调整

### 内存管理
- 使用常量定义减少内存分配
- 模板函数支持参数复用
- 避免不必要的字符串拼接

## 🧪 **测试策略**

### 单元测试
```typescript
describe('Prompt Templates', () => {
  test('generateImageAnalysisPrompt returns valid prompt', () => {
    const prompt = generateImageAnalysisPrompt();
    expect(prompt).toContain('JSON');
    expect(prompt.length).toBeGreaterThan(100);
  });
});
```

### 集成测试
- 验证生成的 prompt 格式正确
- 测试参数注入功能
- 检查响应解析兼容性

## 🔍 **调试和监控**

### 日志输出
```typescript
if (DEBUG_CONFIG.VERBOSE_LOGGING) {
  console.log('🎯 生成的 prompt 长度:', prompt.length);
  console.log('📝 Prompt 预览:', prompt.substring(0, 200));
}
```

### 性能监控
- Prompt 生成时间追踪
- 响应质量评估
- 缓存命中率统计

## 🎁 **最佳实践总结**

1. **简洁明确**: 保持 prompt 简洁，避免冗余信息
2. **结构化输出**: 明确指定 JSON 格式要求
3. **参数化设计**: 使用动态参数而非硬编码
4. **版本管理**: 跟踪每次 prompt 变更
5. **测试验证**: 确保 prompt 输出符合预期
6. **性能优化**: 平衡创意性和响应速度

## 🔮 **未来扩展计划**

- [ ] 多语言 prompt 支持
- [ ] A/B 测试框架
- [ ] 智能 prompt 优化建议
- [ ] 可视化 prompt 编辑器
- [ ] 实时性能分析仪表板

---

*基于企业级 AI Prompt 管理最佳实践构建* 🚀 