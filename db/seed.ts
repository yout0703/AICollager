import { db } from './client'
import { iconCategories, icons } from './schema/icons'
import { eq } from 'drizzle-orm'

async function seed() {
  console.log('🌱 开始种子数据初始化...')

  try {
    // 1. 创建 Icon 分类
    console.log('📂 创建 Icon 分类...')
    
    const categories = [
      {
        categoryId: 'general',
        categoryName: '通用',
        description: '常用的通用图标',
        aiDescription: '基础通用图标，包含常见的操作、导航和界面元素',
        aiKeywords: ['通用', '基础', '常用', '操作', '导航'],
        displayOrder: 1,
        iconColor: '#666666',
      },
      {
        categoryId: 'business',
        categoryName: '商务',
        description: '商务和办公相关图标',
        aiDescription: '商务办公场景图标，包含会议、文档、商业流程等',
        aiKeywords: ['商务', '办公', '会议', '文档', '商业'],
        displayOrder: 2,
        iconColor: '#2563eb',
      },
      {
        categoryId: 'technology',
        categoryName: '科技',
        description: '科技和数字化相关图标',
        aiDescription: '科技数字化图标，包含设备、网络、AI、编程等',
        aiKeywords: ['科技', '数字', '设备', '网络', 'AI', '编程'],
        displayOrder: 3,
        iconColor: '#7c3aed',
      },
      {
        categoryId: 'lifestyle',
        categoryName: '生活',
        description: '日常生活相关图标',
        aiDescription: '日常生活场景图标，包含购物、娱乐、健康、旅行等',
        aiKeywords: ['生活', '购物', '娱乐', '健康', '旅行'],
        displayOrder: 4,
        iconColor: '#dc2626',
      },
      {
        categoryId: 'communication',
        categoryName: '沟通',
        description: '沟通和社交相关图标',
        aiDescription: '沟通社交图标，包含消息、社交媒体、通讯等',
        aiKeywords: ['沟通', '社交', '消息', '通讯', '分享'],
        displayOrder: 5,
        iconColor: '#059669',
      },
    ]

    for (const category of categories) {
      await db.insert(iconCategories).values(category).onConflictDoNothing()
    }

    // 2. 创建示例 Icons
    console.log('🎨 创建示例 Icons...')
    
    const sampleIcons = [
      {
        iconId: 'home',
        iconName: '首页',
        categoryId: 'general',
        svgContent: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>`,
        tags: ['首页', '主页', '房子'],
        keywords: ['home', 'house', 'main'],
        aiTags: ['导航', '入口', '主要'],
      },
      {
        iconId: 'search',
        iconName: '搜索',
        categoryId: 'general',
        svgContent: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35"/></svg>`,
        tags: ['搜索', '查找', '放大镜'],
        keywords: ['search', 'find', 'magnify'],
        aiTags: ['查询', '发现', '探索'],
      },
      {
        iconId: 'user',
        iconName: '用户',
        categoryId: 'general',
        svgContent: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        tags: ['用户', '个人', '账户'],
        keywords: ['user', 'person', 'account'],
        aiTags: ['身份', '个人资料', '登录'],
      },
      {
        iconId: 'settings',
        iconName: '设置',
        categoryId: 'general',
        svgContent: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
        tags: ['设置', '配置', '选项'],
        keywords: ['settings', 'config', 'options'],
        aiTags: ['管理', '调整', '偏好'],
      },
      {
        iconId: 'message',
        iconName: '消息',
        categoryId: 'communication',
        svgContent: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
        tags: ['消息', '聊天', '对话'],
        keywords: ['message', 'chat', 'conversation'],
        aiTags: ['沟通', '交流', '回复'],
      },
    ]

    for (const icon of sampleIcons) {
      await db.insert(icons).values(icon).onConflictDoNothing()
    }

    // 3. 更新分类的图标数量
    console.log('📊 更新分类统计...')
    
    for (const category of categories) {
      const iconCount = await db
        .select({ count: icons.id })
        .from(icons)
        .where(eq(icons.categoryId, category.categoryId))
      
      await db
        .update(iconCategories)
        .set({ iconCount: iconCount.length })
        .where(eq(iconCategories.categoryId, category.categoryId))
    }

    console.log('✅ 种子数据初始化完成!')
    console.log(`📂 创建了 ${categories.length} 个分类`)
    console.log(`🎨 创建了 ${sampleIcons.length} 个示例图标`)

  } catch (error) {
    console.error('❌ 种子数据初始化失败:', error)
    throw error
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 数据库种子数据初始化成功!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 初始化失败:', error)
      process.exit(1)
    })
}

export { seed } 