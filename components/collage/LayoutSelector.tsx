"use client";

import { Layout, SHAPE_LAYOUTS } from "./constants";
import { cn } from "@/lib/utils";

interface LayoutSelectorProps {
  layouts: Layout[];
  shapeLayouts?: Layout[];
  selectedLayout: Layout;
  onSelectLayout: (layout: Layout) => void;
  translateFn: (key: string) => string;
}

// 从CollagePreview组件复制的辅助函数，应用蒙版CSS样式
const getMaskStyle = (layout: Layout, position: number) => {
  const { maskShape } = layout;
  if (!maskShape) return {};

  // 检查是否有针对特定单元格的蒙版
  const cellMask = position !== undefined && maskShape.cellMasks?.[position];

  // 单元格特定蒙版
  if (cellMask) {
    switch (cellMask.type) {
      case 'rectangular':
        const x = (cellMask.x || 0) * 100;
        const y = (cellMask.y || 0) * 100;
        const width = (cellMask.width || 1) * 100;
        const height = (cellMask.height || 1) * 100;
        return {
          clipPath: `inset(${y}% ${100-width-x}% ${100-height-y}% ${x}%)`
        };

      case 'circular':
        const radius = (cellMask.radius || 0.5) * 100;
        return {
          clipPath: `circle(${radius}% at center)`
        };

      case 'path':
        if (cellMask.svgPath) {
          return {
            clipPath: `path('${cellMask.svgPath}')`
          };
        }
        break;
    }
  } else if (maskShape) {
    // 整体蒙版
    switch (maskShape.type) {
      case 'rectangular':
        return {};

      case 'circular':
        return {
          clipPath: 'circle(50% at center)'
        };

      case 'path':
        if (maskShape.svgPath) {
          return {
            clipPath: `path('${maskShape.svgPath}')`
          };
        }
        break;
    }
  }

  return {};
};

// 自定义布局渲染函数 - 根据不同布局ID渲染不同的预览样式
const getLayoutPreview = (layout: Layout) => {
  const { id, cols, rows } = layout;

  // 渲染特殊布局
  if (layout.custom) {
    if (id === "layout-6") {
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-2 gap-1 p-1">
          <div className="bg-muted-foreground/25 row-span-2 col-span-2"></div>
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
        </div>
      );
    }

    if (id === "layout-7") {
      return (
        <div className="w-full aspect-square grid grid-cols-4 grid-rows-3 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-2 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-2 row-span-3"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-2 row-span-1"></div>
        </div>
      );
    }

    if (id === "layout-8") {
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-4 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-3 row-span-2"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-2"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-2"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-2"></div>
        </div>
      );
    }

    if (id === "layout-9") {
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-3 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-2 row-span-2"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
        </div>
      );
    }

    if (id === "layout-10") {
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-2 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-3 row-span-1"></div>
        </div>
      );
    }

    if (id === "layout-11") {
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-3 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-1 row-span-3"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
        </div>
      );
    }

    if (id === "layout-12") {
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-3 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
        </div>
      );
    }
  }

  // 根据不同的ID返回特定的布局预览
  switch (id) {
    // 基础布局
    case "layout-1": // 2x1
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-1 gap-1 p-1">
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
        </div>
      );
    case "layout-2": // 2x2
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-2 gap-1 p-1">
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
        </div>
      );
    case "layout-3": // 3x1
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-1 gap-1 p-1">
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
        </div>
      );
    case "layout-4": // 1x2
      return (
        <div className="w-full aspect-square grid grid-cols-1 grid-rows-2 gap-1 p-1">
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
        </div>
      );
    case "layout-5": // 3x2
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-2 gap-1 p-1">
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
          <div className="bg-muted-foreground/25"></div>
        </div>
      );

    // 更多布局样式 - 参考图片中的样式
    case "layout-7": // 左侧3个小格，右侧1个大格
      return (
        <div className="w-full aspect-square grid grid-cols-4 grid-rows-3 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-2 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-2 row-span-3"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-2 row-span-1"></div>
        </div>
      );
    case "layout-8": // 上方1个大格，下方3个小格
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-4 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-3 row-span-2"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-2"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-2"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-2"></div>
        </div>
      );
    case "layout-9": // 上1大下2小
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-3 gap-1 p-1">
          <div className="bg-muted-foreground/25 col-span-2 row-span-2"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
          <div className="bg-muted-foreground/25 col-span-1 row-span-1"></div>
        </div>
      );

    // 默认渲染方式
    default:
      return (
        <div className={`w-full aspect-square grid grid-cols-${cols} grid-rows-${rows} gap-1 p-1`}>
          {Array.from({ length: cols * rows }).map((_, i) => (
            <div key={i} className="bg-muted-foreground/25"></div>
          ))}
        </div>
      );
  }
};

export default function LayoutSelector({
  layouts,
  shapeLayouts = SHAPE_LAYOUTS,
  selectedLayout,
  onSelectLayout,
  translateFn
}: LayoutSelectorProps) {
  const basicLayouts = layouts.slice(0, 5);
  const featuredLayouts = layouts.slice(5);
  const getLayoutLabel = (layout: Layout) => {
    const key = `layoutLabels.${layout.id}`;
    const translated = translateFn(key);
    return translated === key ? layout.name : translated;
  };
  const renderLayoutButton = (layout: Layout) => (
    <button
      key={layout.id}
      type="button"
      onClick={() => onSelectLayout(layout)}
      className={cn(
        "group rounded-md border bg-background p-2 transition-colors hover:border-primary/60",
        selectedLayout.id === layout.id
          ? "border-primary bg-primary/10"
          : "border-border"
      )}
      title={getLayoutLabel(layout)}
    >
      <div className="mx-auto h-12 w-12 overflow-hidden rounded-sm">
        {getLayoutPreview(layout)}
      </div>
      <span className="mt-1.5 block text-center text-[11px] font-medium leading-4 text-muted-foreground group-hover:text-foreground">
        {getLayoutLabel(layout)}
      </span>
    </button>
  );

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{translateFn('chooseLayout')}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {translateFn('collageWorkspace.layoutDescription')}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {translateFn('collageWorkspace.basicLayouts')}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {basicLayouts.map(renderLayoutButton)}
        </div>
      </div>

      {featuredLayouts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {translateFn('collageWorkspace.featuredLayouts')}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {featuredLayouts.map(renderLayoutButton)}
          </div>
        </div>
      )}

      {shapeLayouts && shapeLayouts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {translateFn('collageWorkspace.shapeLayouts')}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {shapeLayouts.map(layout => (
              <button
                key={layout.id}
                type="button"
                onClick={() => onSelectLayout(layout)}
                className={cn(
                  "group rounded-md border bg-background p-2 transition-colors hover:border-primary/60",
                  selectedLayout.id === layout.id
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
                title={getLayoutLabel(layout)}
              >
                <div className={`mx-auto grid h-12 w-12 ${layout.template} gap-1 rounded-sm p-1`}>
                  {Array.from({ length: layout.cols * layout.rows }).map((_, i) => {
                    const cellStyle = layout.maskShape ? getMaskStyle(layout, i) : {};

                    return (
                      <div
                        key={i}
                        className="relative bg-secondary"
                      >
                        <div
                          className="absolute inset-0 bg-primary/15"
                          style={cellStyle}
                        />
                      </div>
                    );
                  })}
                </div>
                <span className="mt-1.5 block text-center text-[11px] font-medium leading-4 text-muted-foreground group-hover:text-foreground">
                  {getLayoutLabel(layout)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
