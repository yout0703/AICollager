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
];

// 图片类型
export interface CollageImage {
  id: string;
  file: File;
  url: string;
  position?: number; // 在布局中的位置
}

export interface Layout {
  id: string;
  name: string;
  description: string;
  cols: number;
  rows: number;
  template: string;
  custom?: boolean;
}

// 获取拼图布局样式
export const getCollageGridStyle = (selectedLayout: Layout): React.CSSProperties => {
  // 特殊布局处理
  if (selectedLayout.custom) {
    if (selectedLayout.id === "layout-6") {
      return { 
        gridTemplateAreas: "'a a b' 'a a c'",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)"
      };
    }
    return {};
  }
  
  return {};
};

// 获取拼图布局类
export const getCollageGridClass = (selectedLayout: Layout): string => {
  if (selectedLayout.custom) {
    if (selectedLayout.id === "layout-6") {
      return "grid";
    }
    return "grid";
  }
  return `grid ${selectedLayout.template}`;
};

// 拼图推荐尺寸（4:5比例 - 对社交媒体友好）
export const RECOMMENDED_WIDTH = 1080;
export const RECOMMENDED_HEIGHT = 1350;

// 拼图图像质量
export const IMAGE_QUALITY = 0.95; 