// 预设库：风格 + 场景
// 风格与场景可正交组合，由前端选择后传 key；编排层据此注入 styleHint/sceneHint。
// 静态查找表用 Record（规则 ts-set-map），数组由 Record 派生供前端遍历。

export interface StylePreset {
  key: string
  name: string
  description: string
  /** 注入编排 LLM 的风格关键词（英文，直接作为 styleHint） */
  promptKeywords: string
  /** 预览图（可选，前端展示用） */
  thumbnail?: string
}

export interface ScenePreset {
  key: string
  name: string
  description: string
  /** 点击场景模板时填入输入框的示例提示词 */
  examplePrompt: string
  thumbnail?: string
}

const STYLES: Record<string, Omit<StylePreset, 'key'>> = {
  photorealistic: {
    name: '摄影写实',
    description: '逼真的摄影质感',
    promptKeywords:
      'photorealistic, high detail, natural lighting, sharp focus, professional photography, 50mm lens',
  },
  anime: {
    name: '吉卜力动漫',
    description: '日系动漫手绘风',
    promptKeywords:
      'Studio Ghibli style anime illustration, hand-drawn, soft cel shading, vibrant colors, detailed background',
  },
  pixar3d: {
    name: '3D 皮克斯',
    description: '皮克斯风格 3D 渲染',
    promptKeywords:
      'Pixar-style 3D render, subsurface scattering, cinematic lighting, smooth stylized characters, depth of field',
  },
  watercolor: {
    name: '水彩',
    description: '轻盈水彩画风',
    promptKeywords:
      'watercolor painting, soft washes, paper texture, bleeding pigments, delicate brushwork, airy',
  },
  oilpainting: {
    name: '油画',
    description: '厚重油画质感',
    promptKeywords:
      'oil painting, visible brushstrokes, rich impasto texture, classical lighting, deep colors',
  },
  flatminimal: {
    name: '极简扁平',
    description: '扁平矢量插画',
    promptKeywords:
      'flat vector illustration, minimal, geometric shapes, limited palette, clean lines, modern design',
  },
  cyberpunk: {
    name: '赛博朋克',
    description: '霓虹未来风',
    promptKeywords:
      'cyberpunk, neon lights, futuristic, rain-soaked streets, holographic, high contrast, blade runner aesthetic',
  },
  vintagefilm: {
    name: '复古胶片',
    description: '胶片颗粒复古',
    promptKeywords:
      'vintage film photograph, grain, muted faded colors, light leaks, analog, 35mm, nostalgic',
  },
  productshot: {
    name: '产品摄影',
    description: '电商商品精修',
    promptKeywords:
      'professional product photography, studio lighting, clean background, sharp detail, commercial, high resolution',
  },
  isometric: {
    name: '等距插画',
    description: '等距视角插画',
    promptKeywords:
      'isometric illustration, 3D pixel-perfect angles, clean shapes, soft shadows, miniature scene',
  },
  pixelart: {
    name: '像素艺术',
    description: '8/16 位像素风',
    promptKeywords:
      'pixel art, 16-bit, crisp pixels, limited palette, retro game aesthetic, dithering',
  },
  chineseink: {
    name: '国风水墨',
    description: '中国水墨写意',
    promptKeywords:
      'traditional Chinese ink painting, xieyi style, ink wash, rice paper texture, minimalist, elegant brushwork',
  },
}

const SCENES: Record<string, Omit<ScenePreset, 'key'>> = {
  avatar: {
    name: '头像人像',
    description: '个人头像/人像',
    examplePrompt: 'a stylized portrait avatar of a person, centered composition, soft background',
  },
  socialcover: {
    name: '社媒封面',
    description: '社交媒体封面图',
    examplePrompt: 'a wide social media cover image, eye-catching, balanced composition',
  },
  product: {
    name: '电商商品',
    description: '商品主图',
    examplePrompt: 'a product showcase image on a clean studio background, professional lighting',
  },
  poster: {
    name: '节日海报',
    description: '节日/活动海报',
    examplePrompt: 'a festive holiday poster, bold visual focus, vibrant celebratory mood',
  },
  logo: {
    name: 'Logo 图标',
    description: '品牌 Logo/图标',
    examplePrompt: 'a clean minimal logo mark, simple geometric, scalable, on white background',
  },
  wallpaper: {
    name: '手机壁纸',
    description: '竖版壁纸',
    examplePrompt: 'a vertical phone wallpaper, atmospheric, visually balanced',
  },
  food: {
    name: '美食摄影',
    description: '美食特写',
    examplePrompt: 'appetizing food photography, close-up, shallow depth of field, warm lighting',
  },
  landscape: {
    name: '旅行风景',
    description: '风光大片',
    examplePrompt: 'a breathtaking travel landscape, golden hour, wide vista',
  },
}

export const STYLE_PRESETS: StylePreset[] = Object.entries(STYLES).map(([key, v]) => ({
  key,
  ...v,
}))

export const SCENE_PRESETS: ScenePreset[] = Object.entries(SCENES).map(([key, v]) => ({
  key,
  ...v,
}))

export function getStylePreset(key?: string | null): StylePreset | undefined {
  if (!key) return undefined
  const v = STYLES[key]
  return v ? { key, ...v } : undefined
}

export function getScenePreset(key?: string | null): ScenePreset | undefined {
  if (!key) return undefined
  const v = SCENES[key]
  return v ? { key, ...v } : undefined
}

/** 编排层用的风格提示（风格关键词） */
export function getStyleHint(key?: string | null): string | undefined {
  return STYLES[key ?? '']?.promptKeywords
}

/** 编排层用的场景提示（场景名 + 描述） */
export function getSceneHint(key?: string | null): string | undefined {
  const v = SCENES[key ?? '']
  return v ? `${v.name} - ${v.description}` : undefined
}
