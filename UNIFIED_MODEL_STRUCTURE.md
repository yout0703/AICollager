# 统一模型结构文档 (已更新)

## 📋 项目背景
我们的设计是通过 AI 读取用户上传的图片信息，生成拼图方案（包括布局、位置、旋转、缩放等），然后将这个统一的模型传入Canvas画板，实现100%还原AI生成的效果。

## ✅ 统一后的数据流

```
用户上传图片 
    ↓
AI分析图片 (geminiService.ts)
    ↓
AI生成布局建议 (AILayoutSuggestion)
    ↓
转换为统一格式 (collageService.ts) → { canvas_config, elements }
    ↓
存储到数据库 (collageModel.ts) → { canvas_config, elements }
    ↓
API返回数据 (GET /api/collage/[id]) → { canvas_config, elements }
    ↓
Editor加载 (editor/[id]/page.tsx) → canvas_config 映射为 initialCanvas
    ↓
Canvas渲染 (Canvas.tsx) → 完美还原AI生成效果
    ↓
用户编辑 → EditorContext状态更新
    ↓
保存修改 (PUT /api/collage/[id]) → { canvas_config, elements }
```

## 🏗️ 核心数据结构（已统一）

### ✅ 完全统一的字段命名
所有层级都使用相同的字段名：
- **canvas_config**: `CanvasConfig` 类型（画布配置）
- **elements**: `CollageElement[]` 类型（拼图元素数组）

### 1. AI生成阶段 ✅
```typescript
// services/collageService.ts - generateFinalCollageData()
return {
  canvas_config: CanvasConfig,  // ✅ 统一字段名
  elements: CollageElement[]    // ✅ 统一字段名
};
```

### 2. 数据库存储 ✅
```sql
-- 数据库表结构
ac_collages {
  canvas_config JSONB,  -- ✅ 统一字段名
  elements JSONB        -- ✅ 统一字段名
}
```

### 3. API传输 ✅
```typescript
// API响应格式
{
  success: true,
  collage: {
    canvas_config: CanvasConfig,  // ✅ 统一字段名
    elements: CollageElement[]    // ✅ 统一字段名
  }
}
```

### 4. Editor接收 ✅
```typescript
// app/[locale]/editor/[id]/page.tsx
setCollageData({
  canvas_config: data.collage.canvas_config,  // ✅ 统一字段名
  elements: data.collage.elements || []       // ✅ 统一字段名
});

// 传递给EditorProvider时进行适配
<EditorProvider
  initialCanvas={collageData.canvas_config}   // canvas_config → initialCanvas
  initialElements={collageData.elements}      // ✅ 字段名一致
>
```

### 5. 保存更新 ✅
```typescript
// PUT /api/collage/[id] - 请求体
{
  canvas_config: CanvasConfig,  // ✅ 统一字段名
  elements: CollageElement[]    // ✅ 统一字段名
}
```

## 🎯 数据类型定义

### CanvasConfig (画布配置)
```typescript
export interface CanvasConfig {
  width: number;
  height: number;
  aspectRatio: string;      // '1:1', '4:3', '16:9' 等
  backgroundColor: string;
  padding: number;
  borderRadius?: number;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
}
```

### CollageElement (拼图元素)
```typescript
export type CollageElement = ImageElement | IconElement | TextElement | ShapeElement | BorderElement;

// 所有元素的基础接口
export interface BaseElement {
  id: string;
  type: 'image' | 'icon' | 'text' | 'shape' | 'border';
  zIndex: number;
  transform: Transform;     // 位置、大小、旋转等
  style: ElementStyle;      // 样式、透明度、裁剪等
  isLocked: boolean;
  isVisible: boolean;
  aiRecommendation?: {      // AI推荐信息
    reason: string;
    confidence: number;
  };
}
```

## 🔄 版本变更记录

### v2.0 (当前版本) - 完全统一
- ✅ **统一字段名**: 所有层级都使用 `canvas_config` 和 `elements`
- ✅ **API支持**: PUT接口支持更新 `canvas_config` 和 `elements`
- ✅ **类型安全**: 所有接口都使用统一的类型定义
- ✅ **数据流畅通**: AI生成 → 存储 → 加载 → 编辑 → 保存

### v1.0 (已弃用) - 字段名不一致
- ❌ AI生成: `canvas_config` vs Editor期望: `canvas`
- ❌ 多个重复的类型定义
- ❌ 数据转换错误和兼容性问题

## 🎉 优势总结

1. **完全一致性**: 从AI生成到用户编辑，数据结构100%一致
2. **类型安全**: TypeScript严格类型检查，避免运行时错误
3. **易于维护**: 单一数据模型，修改一处全局生效
4. **无缝衔接**: AI生成的结果可以直接在编辑器中使用和修改
5. **扩展性强**: 新增字段时只需在一个地方定义类型

## 🔧 开发指南

### 添加新的元素类型
```typescript
// 1. 在 types/collage.ts 中定义新类型
export interface NewElement extends BaseElement {
  type: 'new_type';
  // 新字段...
}

// 2. 更新联合类型
export type CollageElement = ImageElement | IconElement | ... | NewElement;

// 3. AI生成逻辑会自动支持新类型
```

### 添加新的画布属性
```typescript
// 在 CanvasConfig 接口中添加新字段
export interface CanvasConfig {
  // 现有字段...
  newProperty?: string;  // 新属性
}
```

所有相关的AI生成、存储、加载和编辑功能都会自动支持新属性！

## 🤖 AI服务接口

### AILayoutSuggestion (AI布局建议)
```typescript
export interface AILayoutSuggestion {
  layout_type: 'grid' | 'freeform' | 'masonry' | 'linear' | 'circular' | 'geometric';
  suggestions: Array<{
    image_index: number;
    position: { x: number; y: number; width: number; height: number }; // 百分比
    z_index: number;
    rotation?: number;
    clip_path?: string;  // 几何裁剪路径
    effects?: string[];
    opacity?: number;
  }>;
  reasoning: string;     // AI推理过程
  confidence_score: number;
}
```

## 🎨 Canvas画板支持

Canvas.tsx 组件完全支持统一的 CollageElement 数据结构：

- ✅ **拖拽移动** - 读取/更新 `transform.x`, `transform.y`
- ✅ **缩放调整** - 读取/更新 `transform.width`, `transform.height`
- ✅ **旋转操作** - 读取/更新 `transform.rotation`
- ✅ **几何裁剪** - 支持 `style.clipPath` (AI生成的几何形状)
- ✅ **样式控制** - 完整支持 `ElementStyle` 所有属性
- ✅ **层级管理** - 支持 `zIndex` 排序
- ✅ **锁定状态** - 支持 `isLocked` 和 `isVisible`

## 📁 文件组织

### 核心类型定义
- `types/collage.ts` - **统一的类型定义文件**（所有组件都从这里导入）

### AI服务
- `services/geminiService.ts` - AI分析和布局建议生成
- `services/collageService.ts` - 拼图生成主服务（转换AI输出为统一格式）

### UI组件
- `components/editor/Canvas.tsx` - 核心画板组件
- `components/editor/ElementPanel.tsx` - 元素属性编辑
- `components/editor/LayerPanel.tsx` - 图层管理
- `components/editor/Toolbar.tsx` - 工具栏

### 数据存储
- `models/collage.ts` - 数据库模型
- `contexts/EditorContext.tsx` - React状态管理

## 🧹 已清理的重复代码

### 删除的重复类型定义
- ❌ `services/geminiService.ts` 中的 `CollageElement` 接口
- ❌ `services/geminiService.ts` 中的 `CollageResult` 接口
- ❌ `services/geminiService.ts` 中的 `generateCompleteCollage` 函数

### 删除的中间版本文件
- ❌ `components/collage/AICollagePreview.tsx` - 使用了废弃的数据结构
- ❌ `app/[locale]/collage/[id]/page.tsx` - 依赖已删除的组件

## ✅ 验证清单

### AI输出 → Canvas输入一致性
- [x] CollageElement 类型统一
- [x] Transform 属性匹配
- [x] ElementStyle 属性匹配
- [x] 几何裁剪路径支持 (clipPath)
- [x] AI推荐信息保留

### 组件导入统一性
- [x] 所有组件从 `types/collage.ts` 导入类型
- [x] 移除从 `geminiService.ts` 的类型导入
- [x] 清理重复的类型定义

### 数据流完整性
- [x] AI生成 → collageService转换 → Canvas渲染
- [x] 用户编辑 → EditorContext状态管理 → 数据库保存
- [x] 导出功能支持完整的元素属性

## 🚀 使用示例

```typescript
// AI生成拼图
import { collageService } from '@/services/collageService';

const result = await collageService.generateCollage({
  images: uploadedFiles,
  preferences: { style: 'modern', theme: 'travel' }
});

// Canvas渲染
import Canvas from '@/components/editor/Canvas';

<Canvas 
  elements={result.collage.elements}      // 统一的CollageElement[]
  canvas={result.collage.canvas_config}   // 统一的CanvasConfig
/>
```

## 🎯 总结

现在整个项目使用统一的数据模型：
1. **AI生成的布局建议** → **统一的CollageElement格式**
2. **Canvas组件100%支持** → **所有AI生成的效果都能完美还原**
3. **用户编辑体验一致** → **所有元素都支持相同的操作**
4. **代码维护性提升** → **单一数据源，避免类型冲突**

这确保了从AI生成到用户编辑的整个流程都使用相同的数据结构，实现了您要求的"AI输出和Canvas输入应该是一个模型"的目标。 