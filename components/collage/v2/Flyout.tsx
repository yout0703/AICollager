"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import LayoutSelector from "../LayoutSelector";
import AspectRatioSelector from "../AspectRatioSelector";
import { DEFAULT_ASPECT_RATIOS, DEFAULT_LAYOUTS } from "../constants";
import type { AspectRatio, Layout, ToolId, TranslateFn } from "./types";

interface FlyoutProps {
  tool: ToolId;
  layout: Layout;
  aspectRatio: AspectRatio;
  cellGap: number;
  onSelectLayout: (l: Layout) => void;
  onSelectAspectRatio: (a: AspectRatio) => void;
  onCellGapChange: (value: number) => void;
  onClose: () => void;
  translateFn: TranslateFn;
}

const TOOL_TITLES: Record<ToolId, { title: string; subtitle: string }> = {
  templates: { title: "选择模板", subtitle: "点击应用 · 实时预览" },
  aspect: { title: "画布比例", subtitle: "选择最终导出的画布尺寸" },
  background: { title: "背景与边距", subtitle: "调整拼图边距与背景颜色" },
  effects: { title: "滤镜", subtitle: "为拼图整体应用色彩效果" },
  settings: { title: "设置", subtitle: "导出选项与画布偏好" },
};

export default function Flyout({
  tool,
  layout,
  aspectRatio,
  cellGap,
  onSelectLayout,
  onSelectAspectRatio,
  onCellGapChange,
  onClose,
  translateFn,
}: FlyoutProps) {
  const meta = TOOL_TITLES[tool];

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{meta.title}</h3>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
            {meta.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tool === "templates" && (
          <LayoutSelector
            layouts={DEFAULT_LAYOUTS}
            selectedLayout={layout}
            onSelectLayout={onSelectLayout}
            translateFn={translateFn}
          />
        )}

        {tool === "aspect" && (
          <AspectRatioSelector
            aspectRatios={DEFAULT_ASPECT_RATIOS}
            selectedAspectRatio={aspectRatio}
            onSelectAspectRatio={onSelectAspectRatio}
            translateFn={translateFn}
          />
        )}

        {tool === "background" && (
          <BackgroundPanel cellGap={cellGap} onCellGapChange={onCellGapChange} />
        )}

        {(tool === "effects" || tool === "settings") && (
          <ComingSoon label={meta.title} />
        )}
      </div>
    </aside>
  );
}

function BackgroundPanel({
  cellGap,
  onCellGapChange,
}: {
  cellGap: number;
  onCellGapChange: (value: number) => void;
}): JSX.Element {
  const quickValues = [0, 4, 8, 16];

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          格子间距
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          调整格子之间的留白宽度（像素）
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-foreground">间距</span>
          <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] tabular-nums text-foreground">
            {cellGap} px
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={32}
          step={1}
          value={cellGap}
          onChange={(e) => onCellGapChange(parseInt(e.target.value, 10))}
          className="h-2 w-full cursor-pointer accent-primary"
        />
      </div>

      <div className="flex gap-2">
        {quickValues.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onCellGapChange(value)}
            className={cn(
              "flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
              cellGap === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-secondary",
            )}
          >
            {value} px
          </button>
        ))}
      </div>

      <div className="space-y-2 text-center">
        <div
          className="mx-auto grid h-24 w-24 grid-cols-2 rounded-md bg-secondary"
          style={{ gap: `${cellGap}px`, padding: `${cellGap}px` }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-sm bg-primary/30"
              style={{ minHeight: 0, minWidth: 0 }}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">预览效果（2 × 2）</p>
      </div>

      <p className="text-[11px] leading-4 text-muted-foreground">
        提示：间距 = 0 时预览与导出完全一致；提高间距会在格子之间生成白色留白。
      </p>
    </section>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-6 text-center">
      <h4 className="text-sm font-semibold text-foreground">{label}</h4>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        即将上线 — 我们正在打磨这一组功能。
      </p>
    </div>
  );
}
