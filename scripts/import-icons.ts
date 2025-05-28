import { IconService } from '@/services/iconService';
import fs from 'fs';
import path from 'path';

// 基础Icon数据
const BASIC_ICONS = [
  // 旅行分类
  {
    icon_id: 'travel-airplane',
    icon_name: '飞机',
    category_id: 'travel',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>',
    style: 'outline' as const,
    tags: ['飞机', '航班', '旅行', '交通'],
    ai_keywords: ['airplane', 'flight', 'travel', 'transport', 'aviation'],
    ai_description: '商用客机图标，适用于旅行、航空、交通主题'
  },
  {
    icon_id: 'travel-car',
    icon_name: '汽车',
    category_id: 'travel',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m6.75 4.5v-3.375m0 0V9.75m0 1.5V9.75m0 1.5h.375m-.375 0h.375m0 0h.375m.375 0h.375M21 10.5h.375m-.375 0h.375M21 10.5v.375m0-.375v.375m0 .375h.375m-.375 0H21M16.5 9.75V6.375m0 0a1.125 1.125 0 00-1.125-1.125H14.25M16.5 6.375V4.875m0 1.5h.375M16.5 6.375h.375M16.5 4.875V3.375m0 1.5h.375m-.375 0h.375" /></svg>',
    style: 'outline' as const,
    tags: ['汽车', '自驾', '公路', '交通'],
    ai_keywords: ['car', 'auto', 'vehicle', 'road', 'transport'],
    ai_description: '汽车图标，适用于自驾游、交通、出行主题'
  },
  {
    icon_id: 'travel-train',
    icon_name: '火车',
    category_id: 'travel',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m6.75 4.5v-3.375m0 0V9.75m0 1.5V9.75m0 1.5h.375m-.375 0h.375" /></svg>',
    style: 'outline' as const,
    tags: ['火车', '铁路', '高铁', '交通'],
    ai_keywords: ['train', 'railway', 'metro', 'transport'],
    ai_description: '火车图标，适用于铁路旅行、城际交通主题'
  },
  {
    icon_id: 'travel-suitcase',
    icon_name: '行李箱',
    category_id: 'travel',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>',
    style: 'outline' as const,
    tags: ['行李箱', '旅行箱', '打包', '出行'],
    ai_keywords: ['suitcase', 'luggage', 'baggage', 'travel'],
    ai_description: '行李箱图标，适用于旅行打包、出行准备主题'
  },

  // 美食分类
  {
    icon_id: 'food-pizza',
    icon_name: '披萨',
    category_id: 'food',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v15.75m-3-15.75v15.75m0-15.75l-3.394 17.552a.75.75 0 01-1.357-.124L5.75 8.25m15.75 0l-1.5 15.375a.75.75 0 01-1.357.124L15.25 8.25" /></svg>',
    style: 'outline' as const,
    tags: ['披萨', '意大利', '快餐', '美食'],
    ai_keywords: ['pizza', 'italian', 'food', 'meal'],
    ai_description: '披萨图标，适用于意式美食、快餐、聚餐主题'
  },
  {
    icon_id: 'food-coffee',
    icon_name: '咖啡',
    category_id: 'food',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>',
    style: 'outline' as const,
    tags: ['咖啡', '饮品', '早餐', '提神'],
    ai_keywords: ['coffee', 'drink', 'beverage', 'cafe'],
    ai_description: '咖啡图标，适用于咖啡厅、早餐、饮品主题'
  },
  {
    icon_id: 'food-cake',
    icon_name: '蛋糕',
    category_id: 'food',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M9 16.5v.375c0 .621.504 1.125 1.125 1.125h3.75A1.125 1.125 0 0015 16.875V16.5M9 16.5h6m-6 0a1.5 1.5 0 00-1.5 1.5v.375c0 .621.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125V18a1.5 1.5 0 00-1.5-1.5m-6 0V9a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5v7.5m-6 0h6" /></svg>',
    style: 'outline' as const,
    tags: ['蛋糕', '甜品', '生日', '庆祝'],
    ai_keywords: ['cake', 'dessert', 'birthday', 'celebration'],
    ai_description: '蛋糕图标，适用于生日庆祝、甜品、派对主题'
  },

  // 自然分类
  {
    icon_id: 'nature-tree',
    icon_name: '树木',
    category_id: 'nature',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l-.463 2.065c-.478 2.135-2.069 3.867-4.287 4.668a.75.75 0 01-.5 0C7.69 10.903 6.1 9.171 5.622 7.036L5.159 4.971m13.591 0L21 12.75v.375c0 3.866-3.134 7-7 7s-7-3.134-7-7V12.75L9.25 4.97" /></svg>',
    style: 'outline' as const,
    tags: ['树木', '森林', '自然', '环保'],
    ai_keywords: ['tree', 'nature', 'forest', 'environment'],
    ai_description: '树木图标，适用于环保、自然、森林主题'
  },
  {
    icon_id: 'nature-flower',
    icon_name: '花朵',
    category_id: 'nature',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3a6.364 6.364 0 003.07.673 6.364 6.364 0 003.07-.673 6.364 6.364 0 00.673 3.07 6.364 6.364 0 00-.673 3.07A6.364 6.364 0 0015.07 9a6.364 6.364 0 00-3.07.673A6.364 6.364 0 009 9a6.364 6.364 0 00-3.07.14A6.364 6.364 0 005.258 6.07 6.364 6.364 0 008.93 3z" /></svg>',
    style: 'outline' as const,
    tags: ['花朵', '鲜花', '春天', '美丽'],
    ai_keywords: ['flower', 'blossom', 'spring', 'beautiful'],
    ai_description: '花朵图标，适用于春天、浪漫、自然美景主题'
  },
  {
    icon_id: 'nature-sun',
    icon_name: '太阳',
    category_id: 'nature',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>',
    style: 'outline' as const,
    tags: ['太阳', '阳光', '晴天', '温暖'],
    ai_keywords: ['sun', 'sunny', 'bright', 'warm'],
    ai_description: '太阳图标，适用于晴天、阳光、温暖、夏日主题'
  },

  // 庆祝分类
  {
    icon_id: 'celebration-gift',
    icon_name: '礼物',
    category_id: 'celebration',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m-8.25 3.75h16.5" /></svg>',
    style: 'outline' as const,
    tags: ['礼物', '礼品', '惊喜', '庆祝'],
    ai_keywords: ['gift', 'present', 'surprise', 'celebration'],
    ai_description: '礼物图标，适用于节日庆祝、生日、惊喜主题'
  },
  {
    icon_id: 'celebration-star',
    icon_name: '星星',
    category_id: 'celebration',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>',
    style: 'outline' as const,
    tags: ['星星', '闪耀', '成就', '优秀'],
    ai_keywords: ['star', 'shine', 'achievement', 'excellent'],
    ai_description: '星星图标，适用于成就、优秀、闪耀、夜空主题'
  },
  {
    icon_id: 'celebration-heart',
    icon_name: '爱心',
    category_id: 'celebration',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>',
    style: 'outline' as const,
    tags: ['爱心', '喜欢', '浪漫', '情人节'],
    ai_keywords: ['heart', 'love', 'like', 'romantic'],
    ai_description: '爱心图标，适用于浪漫、情人节、喜欢、爱情主题'
  },

  // 人物分类
  {
    icon_id: 'people-user',
    icon_name: '用户',
    category_id: 'people',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
    style: 'outline' as const,
    tags: ['用户', '人物', '个人', '账户'],
    ai_keywords: ['user', 'person', 'account', 'profile'],
    ai_description: '用户图标，适用于个人资料、账户、人物主题'
  },
  {
    icon_id: 'people-family',
    icon_name: '家庭',
    category_id: 'people',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>',
    style: 'outline' as const,
    tags: ['家庭', '家人', '团聚', '亲情'],
    ai_keywords: ['family', 'group', 'together', 'relatives'],
    ai_description: '家庭图标，适用于家人聚会、团聚、亲情主题'
  },

  // 通用分类
  {
    icon_id: 'general-home',
    icon_name: '房子',
    category_id: 'general',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>',
    style: 'outline' as const,
    tags: ['房子', '家', '住宅', '建筑'],
    ai_keywords: ['home', 'house', 'building', 'residence'],
    ai_description: '房子图标，适用于家庭、住宅、建筑主题'
  },
  {
    icon_id: 'general-phone',
    icon_name: '电话',
    category_id: 'general',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>',
    style: 'outline' as const,
    tags: ['电话', '通讯', '联系', '呼叫'],
    ai_keywords: ['phone', 'call', 'contact', 'communication'],
    ai_description: '电话图标，适用于联系、通讯、客服主题'
  },

  // 装饰分类
  {
    icon_id: 'decoration-sparkles',
    icon_name: '闪光',
    category_id: 'decoration',
    svg_content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>',
    style: 'outline' as const,
    tags: ['闪光', '装饰', '魔法', '特效'],
    ai_keywords: ['sparkles', 'magic', 'decoration', 'effect'],
    ai_description: '闪光图标，适用于魔法、装饰、特效、庆祝主题'
  }
];

// 批量导入Icon数据
export async function importBasicIcons(): Promise<{
  success: boolean;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  message?: string;
}> {
  try {
    console.log('开始导入基础Icon数据...');
    
    const result = await IconService.batchImportIcons(BASIC_ICONS);
    
    console.log(`导入完成: 成功 ${result.imported_count}, 跳过 ${result.skipped_count}, 失败 ${result.error_count}`);
    
    if (result.errors && result.errors.length > 0) {
      console.error('导入错误:', result.errors);
    }
    
    return {
      success: result.success,
      imported_count: result.imported_count,
      skipped_count: result.skipped_count,
      error_count: result.error_count,
      message: `成功导入 ${result.imported_count} 个图标`
    };
    
  } catch (error) {
    console.error('导入Icon数据失败:', error);
    return {
      success: false,
      imported_count: 0,
      skipped_count: 0,
      error_count: BASIC_ICONS.length,
      message: '导入失败'
    };
  }
}

// 从SVG文件目录导入Icons
export async function importIconsFromDirectory(dirPath: string, categoryId: string): Promise<{
  success: boolean;
  imported_count: number;
  message?: string;
}> {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`目录不存在: ${dirPath}`);
    }
    
    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.svg'));
    console.log(`找到 ${files.length} 个SVG文件`);
    
    const icons = [];
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const svgContent = fs.readFileSync(filePath, 'utf8');
      const iconName = path.basename(file, '.svg');
      const iconId = `${categoryId}-${iconName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      icons.push({
        icon_id: iconId,
        icon_name: iconName,
        category_id: categoryId,
        svg_content: svgContent,
        style: 'outline' as const,
        tags: [iconName],
        ai_keywords: [iconName.toLowerCase()],
        source: 'file_import'
      });
    }
    
    const result = await IconService.batchImportIcons(icons);
    
    return {
      success: result.success,
      imported_count: result.imported_count,
      message: `从目录导入 ${result.imported_count} 个图标`
    };
    
  } catch (error) {
    console.error('从目录导入Icons失败:', error);
    return {
      success: false,
      imported_count: 0,
      message: error instanceof Error ? error.message : '导入失败'
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  importBasicIcons()
    .then((result) => {
      console.log('导入结果:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
} 