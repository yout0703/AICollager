// 默认布局配置
export const DEFAULT_LAYOUTS = [
  {
    id: "layout-1",
    name: "2 x 1",
    description: "简单双分割",
    cols: 2,
    rows: 1,
    template: "grid-cols-2 grid-rows-1",
  },
  {
    id: "layout-2",
    name: "2 x 2",
    description: "四格棋盘",
    cols: 2,
    rows: 2,
    template: "grid-cols-2 grid-rows-2",
  },
  {
    id: "layout-3",
    name: "3 x 1",
    description: "三列式",
    cols: 3,
    rows: 1,
    template: "grid-cols-3 grid-rows-1",
  },
  {
    id: "layout-4",
    name: "1 x 2",
    description: "双行",
    cols: 1,
    rows: 2,
    template: "grid-cols-1 grid-rows-2",
  },
  {
    id: "layout-5",
    name: "3 x 2",
    description: "六格",
    cols: 3,
    rows: 2,
    template: "grid-cols-3 grid-rows-2",
  },
  {
    id: "layout-6",
    name: "特殊布局1",
    description: "主副搭配",
    cols: 2,
    rows: 2,
    template: "grid-special-1",
    custom: true,
  },
  {
    id: "layout-7",
    name: "左3右1",
    description: "左侧3个小格，右侧1个大格",
    cols: 4, 
    rows: 3,
    template: "grid-special-2",
    custom: true,
  },
  {
    id: "layout-8",
    name: "上1下3",
    description: "上方1个大格，下方3个小格",
    cols: 3,
    rows: 4,
    template: "grid-special-3",
    custom: true,
  },
  {
    id: "layout-9",
    name: "上1下2",
    description: "上方1个大格，下方2个小格",
    cols: 2,
    rows: 3,
    template: "grid-special-4",
    custom: true,
  },
  {
    id: "layout-10",
    name: "上3下1",
    description: "上方3个小格，下方1个大格",
    cols: 3,
    rows: 2,
    template: "grid-special-5",
    custom: true,
  },
  {
    id: "layout-11",
    name: "左1右3",
    description: "左侧1个大格，右侧3个小格",
    cols: 2,
    rows: 3,
    template: "grid-special-6",
    custom: true,
  },
  {
    id: "layout-12",
    name: "中心突出",
    description: "中心大格，四周小格",
    cols: 3,
    rows: 3,
    template: "grid-special-7",
    custom: true,
  },
];

// 图片类型
export interface CollageImage {
  id: string;
  file?: File;
  url: string;
  position?: number; // 在布局中的位置
  
  // 图像变换属性
  transform?: ImageTransform;
}

// 拼图尺寸比例
export interface AspectRatio {
  id: string;
  name: string;
  description: string;
  ratio: number; // 宽度/高度
  width: number; // 推荐宽度（像素）
  height: number; // 推荐高度（像素）
}

// 默认尺寸比例选项
export const DEFAULT_ASPECT_RATIOS: AspectRatio[] = [
  {
    id: "aspect-1-1",
    name: "1:1",
    description: "正方形，适合Instagram",
    ratio: 1,
    width: 1080,
    height: 1080
  },
  {
    id: "aspect-4-5",
    name: "4:5",
    description: "Instagram推荐，垂直",
    ratio: 0.8,
    width: 1080,
    height: 1350
  },
  {
    id: "aspect-16-9",
    name: "16:9",
    description: "宽屏幕，水平",
    ratio: 16/9,
    width: 1920,
    height: 1080
  },
  {
    id: "aspect-9-16",
    name: "9:16",
    description: "移动设备，垂直",
    ratio: 9/16,
    width: 1080,
    height: 1920
  },
  {
    id: "aspect-3-4",
    name: "3:4",
    description: "传统相片，垂直",
    ratio: 3/4,
    width: 1200,
    height: 1600
  },
  {
    id: "aspect-4-3",
    name: "4:3",
    description: "传统相片，水平",
    ratio: 4/3,
    width: 1600,
    height: 1200
  }
];

// 图像变换属性
export interface ImageTransform {
  // 在单元格内的相对位置 (0-1范围)
  offsetX: number;
  offsetY: number;
  
  // 缩放比例
  scale: number;
  
  // 旋转角度 (弧度)
  rotation: number;
  
  // 是否保持原始比例
  keepAspectRatio: boolean;
}

// 默认图像变换值
export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
  offsetX: 0.5,  // 居中
  offsetY: 0.5,  // 居中
  scale: 1,      // 原始大小
  rotation: 0,   // 不旋转
  keepAspectRatio: true // 保持原始比例
};

export interface Layout {
  id: string;
  name: string;
  description: string;
  cols: number;
  rows: number;
  template: string;
  custom?: boolean;
  
  // 蒙版形状定义（可选）
  maskShape?: MaskShape;
}

// 蒙版形状定义
export interface MaskShape {
  // 形状类型
  type: 'rectangular' | 'circular' | 'path' | 'custom';
  
  // SVG路径定义（对于'path'类型）
  svgPath?: string;
  
  // 自定义形状绘制函数（对于'custom'类型）
  // 用于在Canvas上定义任意形状
  drawFunction?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  
  // 单元格形状定义，针对每个单元格的蒙版
  // 索引是单元格位置，值是该单元格的形状
  cellMasks?: Record<number, {
    type: 'rectangular' | 'circular' | 'path';
    svgPath?: string;
    x?: number; // 在单元格内的相对位置 (0-1)
    y?: number; // 在单元格内的相对位置 (0-1)
    width?: number; // 相对宽度 (0-1)
    height?: number; // 相对高度 (0-1)
    radius?: number; // 圆形半径 (0-1，相对于单元格宽度)
  }>;
}

// 获取拼图布局样式
export const getCollageGridStyle = (selectedLayout: Layout): React.CSSProperties => {
  // 特殊布局处理
  if (selectedLayout.custom) {
    switch (selectedLayout.id) {
      case "layout-6":
        return { 
          gridTemplateAreas: "'a a b' 'a a c'",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)"
        };
      case "layout-7":
        return { 
          gridTemplateAreas: "'a a d d' 'b c d d' 'e e d d'",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)"
        };
      case "layout-8":
        return { 
          gridTemplateAreas: "'a a a' 'a a a' 'b c d' 'b c d'",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)"
        };
      case "layout-9":
        return { 
          gridTemplateAreas: "'a a' 'a a' 'b c'",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)"
        };
      case "layout-10":
        return { 
          gridTemplateAreas: "'a b c' 'd d d'",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)"
        };
      case "layout-11":
        return { 
          gridTemplateAreas: "'a b' 'a c' 'a d'",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)"
        };
      case "layout-12":
        return { 
          gridTemplateAreas: "'a b c' 'd e f' 'g h i'",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)"
        };
      default:
        return {};
    }
  }
  
  return {};
};

// 获取拼图布局类
export const getCollageGridClass = (selectedLayout: Layout): string => {
  if (selectedLayout.custom) {
    return "grid";
  }
  return `grid ${selectedLayout.template}`;
};

// 拼图推荐尺寸（4:5比例 - 对社交媒体友好）
export const RECOMMENDED_WIDTH = 1080;
export const RECOMMENDED_HEIGHT = 1350;

// 拼图图像质量
export const IMAGE_QUALITY = 0.95;

// 添加心形布局示例
export const SHAPE_LAYOUTS = [
  {
    id: "shape-heart",
    name: "心形",
    description: "心形相框",
    cols: 1,
    rows: 1,
    template: "grid-cols-1 grid-rows-1",
    maskShape: {
      type: 'path' as 'path',
      svgPath: "M50,15 A15,15 0 0,1 85,45 A15,15 0 0,1 115,45 A15,15 0 0,1 150,85 L85,150 L50,115 A15,15 0 0,1 15,85 A15,15 0 0,1 50,15 z",
    }
  },
  {
    id: "shape-circular",
    name: "圆形",
    description: "圆形相框",
    cols: 1,
    rows: 1,
    template: "grid-cols-1 grid-rows-1",
    maskShape: {
      type: 'circular' as 'circular'
    }
  },
  {
    id: "shape-polaroid",
    name: "宝丽来",
    description: "宝丽来相框",
    cols: 1,
    rows: 1,
    template: "grid-cols-1 grid-rows-1",
    maskShape: {
      type: 'rectangular' as 'rectangular',
      cellMasks: {
        0: {
          type: 'rectangular' as 'rectangular',
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.7
        }
      }
    }
  },
  {
    id: "shape-multi-circle",
    name: "圆形拼贴",
    description: "多圆形拼贴",
    cols: 2,
    rows: 2,
    template: "grid-cols-2 grid-rows-2",
    maskShape: {
      type: 'custom' as 'custom',
      cellMasks: {
        0: { type: 'circular' as 'circular', radius: 0.45 },
        1: { type: 'circular' as 'circular', radius: 0.45 },
        2: { type: 'circular' as 'circular', radius: 0.45 },
        3: { type: 'circular' as 'circular', radius: 0.45 }
      }
    }
  }
]; 