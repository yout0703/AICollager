"use client";

/**
 * Collage 改版方案：可视化 Mockup
 * 仅作为视觉演示，无任何业务逻辑接入。
 * 访问路径: /<locale>/collage-mockup
 */

import { useState } from "react";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  ChevronDown,
  LayoutGrid,
  Frame,
  Palette,
  Sparkles,
  Settings,
  Plus,
  Wand2,
  Maximize2,
  RotateCw,
  Replace,
  Trash2,
  Crop,
  FlipHorizontal,
  Sun,
  HelpCircle,
  Check,
  Lock,
  Heart,
  Circle,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ----------- 演示数据 -----------
const PHOTO = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

const PHOTOS = [
  { id: "p1", seed: "tokyo01", used: true },
  { id: "p2", seed: "kyoto02", used: true, selected: true },
  { id: "p3", seed: "osaka03", used: false },
  { id: "p4", seed: "hokkaido", used: true },
  { id: "p5", seed: "fuji05", used: false },
  { id: "p6", seed: "nara06", used: false },
  { id: "p7", seed: "okinawa", used: false },
];

const TEMPLATE_GROUPS = [
  {
    label: "常用",
    items: [
      { id: "t1", name: "2 × 1", preview: "grid-cols-2 grid-rows-1" },
      { id: "t2", name: "2 × 2", preview: "grid-cols-2 grid-rows-2", active: true },
      { id: "t3", name: "3 × 1", preview: "grid-cols-3 grid-rows-1" },
      { id: "t4", name: "3 × 2", preview: "grid-cols-3 grid-rows-2" },
    ],
  },
  {
    label: "组合",
    items: [
      { id: "t5", name: "主图+三小", preview: "grid-cols-3 grid-rows-2", areas: "'a a b' 'a a c'" },
      { id: "t6", name: "顶通栏", preview: "grid-cols-3 grid-rows-2", areas: "'a a a' 'b c d'" },
      { id: "t7", name: "竖通栏", preview: "grid-cols-2 grid-rows-3", areas: "'a b' 'a c' 'a d'" },
      { id: "t8", name: "九宫格", preview: "grid-cols-3 grid-rows-3" },
    ],
  },
  {
    label: "形状",
    items: [
      { id: "s1", name: "圆形", icon: Circle },
      { id: "s2", name: "心形", icon: Heart },
      { id: "s3", name: "方形", icon: Square },
    ],
  },
];

// ----------- 顶部工具栏 -----------
function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-5 w-px bg-border" />
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            京都 · 春行
            <button className="text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground">已自动保存 · 1 分钟前</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Undo2 className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
          预览
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Download className="h-3.5 w-3.5" />
          下载
          <span className="ml-1 h-3 w-px bg-primary-foreground/30" />
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </header>
  );
}

// ----------- 左侧 icon rail -----------
const TOOLS = [
  { id: "templates", icon: LayoutGrid, label: "模板" },
  { id: "aspect", icon: Frame, label: "画布" },
  { id: "background", icon: Palette, label: "边距/背景" },
  { id: "effects", icon: Sparkles, label: "滤镜" },
  { id: "settings", icon: Settings, label: "设置" },
] as const;

type ToolId = typeof TOOLS[number]["id"] | null;

function LeftRail({ active, onSelect }: { active: ToolId; onSelect: (id: ToolId) => void }) {
  return (
    <nav className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-3">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = active === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(isActive ? null : tool.id)}
            className={cn(
              "group relative flex h-12 w-12 flex-col items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            title={tool.label}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="mt-0.5 text-[10px] font-medium leading-3">{tool.label}</span>
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
          </button>
        );
      })}

      <div className="mt-auto">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="快捷键"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>
      </div>
    </nav>
  );
}

// ----------- Flyout 面板 -----------
function TemplatesFlyout() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">选择模板</h3>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
          点击应用 · 长按预览
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {TEMPLATE_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h4>
              <span className="text-[10px] text-muted-foreground">{group.items.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((tpl: any) => (
                <button
                  key={tpl.id}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-md border bg-background p-1.5 transition-all hover:border-primary",
                    tpl.active
                      ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.15)]"
                      : "border-border"
                  )}
                >
                  {tpl.icon ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <tpl.icon className="h-7 w-7 text-muted-foreground/70 group-hover:text-foreground" />
                    </div>
                  ) : (
                    <div
                      className={cn("grid h-full w-full gap-0.5", tpl.preview)}
                      style={tpl.areas ? { gridTemplateAreas: tpl.areas } : undefined}
                    >
                      {Array.from({ length: 9 }).map((_, i) => {
                        const areas: string[] | undefined = tpl.areas
                          ?.replace(/'/g, "")
                          .split(" ")
                          .filter(Boolean);
                        const uniqueAreas: string[] | null = areas
                          ? Array.from(new Set(areas))
                          : null;
                        if (uniqueAreas) {
                          if (i >= uniqueAreas.length) return null;
                          return (
                            <div
                              key={i}
                              className="rounded-sm bg-gradient-to-br from-primary/20 to-primary/5"
                              style={{ gridArea: uniqueAreas[i] }}
                            />
                          );
                        }
                        const cells = parseInt(tpl.preview.match(/grid-cols-(\d)/)?.[1] || "1") *
                          parseInt(tpl.preview.match(/grid-rows-(\d)/)?.[1] || "1");
                        if (i >= cells) return null;
                        return (
                          <div
                            key={i}
                            className="rounded-sm bg-gradient-to-br from-primary/20 to-primary/5"
                          />
                        );
                      })}
                    </div>
                  )}
                  {tpl.active && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-1.5 pt-2 pb-1 text-[10px] font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {tpl.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ----------- 中间画布区 -----------
function CanvasArea() {
  // 中间 2x2 拼图，cell 1 (top-right) 是选中状态
  const cells = [
    { id: 0, photoSeed: "tokyo01", selected: false, empty: false },
    { id: 1, photoSeed: "kyoto02", selected: true, empty: false },
    { id: 2, photoSeed: null, selected: false, empty: true },
    { id: 3, photoSeed: "hokkaido", selected: false, empty: false },
  ];

  return (
    <main className="relative flex flex-1 flex-col bg-[hsl(var(--secondary))]">
      {/* 画布工具条（极简） */}
      <div className="flex h-11 items-center justify-between border-b border-border bg-card/50 px-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">1 : 1</span>
          <span className="h-3 w-px bg-border" />
          <span>1080 × 1080 px</span>
          <span className="h-3 w-px bg-border" />
          <span>4 / 4 已填充</span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5 text-xs">
          <button className="rounded px-2.5 py-1 font-medium text-muted-foreground hover:bg-secondary">
            50%
          </button>
          <button className="rounded bg-secondary px-2.5 py-1 font-medium text-foreground">
            100%
          </button>
          <button className="rounded px-2.5 py-1 font-medium text-muted-foreground hover:bg-secondary">
            适应
          </button>
        </div>
      </div>

      {/* 画布主体 */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-8">
        {/* 棋盘背景（暗示透明） */}
        <div className="absolute inset-0 subtle-grid opacity-40" aria-hidden />

        {/* 拼图本体 */}
        <div className="relative aspect-square w-full max-w-[480px] rounded-xl bg-card shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)]">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
            {cells.map((cell) => (
              <div
                key={cell.id}
                className={cn(
                  "group relative overflow-hidden rounded-md transition-all",
                  cell.empty &&
                    "border-2 border-dashed border-primary/40 bg-primary/5",
                  cell.selected && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                )}
              >
                {cell.empty ? (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Plus className="h-5 w-5" />
                    </div>
                    <p className="text-[11px] font-medium text-primary">点击或拖拽</p>
                    <p className="text-[10px] text-muted-foreground">添加照片到这个格子</p>
                  </div>
                ) : (
                  <>
                    <img
                      src={PHOTO(cell.photoSeed!)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {/* 选中状态: 角点 + 浮动工具条 */}
                    {cell.selected && (
                      <>
                        {/* 角点 */}
                        {[
                          "left-0 top-0",
                          "right-0 top-0",
                          "left-0 bottom-0",
                          "right-0 bottom-0",
                        ].map((pos) => (
                          <span
                            key={pos}
                            className={cn(
                              "absolute h-2.5 w-2.5 rounded-sm border-2 border-primary bg-card",
                              pos
                            )}
                            style={{
                              transform:
                                pos.includes("left") && pos.includes("top")
                                  ? "translate(-50%, -50%)"
                                  : pos.includes("right") && pos.includes("top")
                                  ? "translate(50%, -50%)"
                                  : pos.includes("left") && pos.includes("bottom")
                                  ? "translate(-50%, 50%)"
                                  : "translate(50%, 50%)",
                            }}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 浮动图片工具条 - 在选中图片下方 */}
          <div
            className="absolute z-10 flex items-center gap-0.5 rounded-lg border border-border bg-card px-1 py-1 shadow-lg"
            style={{ top: "calc(50% - 28px)", left: "calc(75% + 24px)" }}
          >
            <FloatingToolbarButton icon={Maximize2} label="适应" />
            <FloatingToolbarButton icon={Crop} label="填满" active />
            <FloatingToolbarButton icon={RotateCw} label="旋转 90°" />
            <FloatingToolbarButton icon={FlipHorizontal} label="翻转" />
            <span className="mx-0.5 h-5 w-px bg-border" />
            <FloatingToolbarButton icon={Replace} label="替换" />
            <FloatingToolbarButton icon={Trash2} label="删除" danger />
          </div>
        </div>

        {/* 智能填充提示 */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-md">
          <Wand2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            还有 1 个空位 · 自动填入剩下的照片?
          </span>
          <button className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            一键填充
          </button>
          <button className="text-muted-foreground hover:text-foreground">
            <span className="sr-only">关闭</span>
            ×
          </button>
        </div>
      </div>
    </main>
  );
}

function FloatingToolbarButton({
  icon: Icon,
  label,
  active,
  danger,
}: {
  icon: any;
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active && "bg-primary/10 text-primary",
        danger && "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
        !active && !danger && "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// ----------- 右侧上下文面板 -----------
function RightContextPanel() {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">图片调整</h3>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            已选中
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
          位置 #2 · 点击空白处取消选择
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* 缩略图预览 */}
        <div className="relative aspect-video overflow-hidden rounded-md bg-secondary">
          <img
            src={PHOTO("kyoto02")}
            alt=""
            className="h-full w-full object-cover"
          />
          <button className="absolute right-2 top-2 flex h-7 items-center gap-1 rounded-md bg-card/95 px-2 text-[11px] font-medium text-foreground shadow-sm hover:bg-card">
            <Replace className="h-3 w-3" />
            替换
          </button>
        </div>

        {/* 快捷动作 */}
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            快捷操作
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: Maximize2, label: "适应格子" },
              { icon: Crop, label: "填满格子" },
              { icon: RotateCw, label: "旋转 90°" },
              { icon: FlipHorizontal, label: "水平翻转" },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <action.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* 调整 */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            手动调整
          </h4>

          <Slider label="缩放" value="120%" min={50} max={200} current={70} />
          <Slider label="旋转" value="0°" min={-180} max={180} current={50} />

          <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">锁定比例</span>
            </div>
            <button
              className="relative inline-flex h-5 w-9 cursor-pointer rounded-full bg-primary transition-colors"
              aria-pressed
            >
              <span className="pointer-events-none ml-auto inline-block h-3.5 w-3.5 translate-x-[-2px] translate-y-[2px] rounded-full bg-background" />
            </button>
          </div>
        </div>

        {/* 滤镜（折叠区） */}
        <details className="rounded-md border border-border bg-background">
          <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-medium text-foreground">
            <span className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              色彩与滤镜
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </summary>
          <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            亮度、对比度、饱和度…（展开后显示）
          </div>
        </details>
      </div>

      {/* 底部重置 */}
      <div className="border-t border-border p-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
          <Undo2 className="h-3.5 w-3.5" />
          重置全部调整
        </button>
      </div>
    </aside>
  );
}

function Slider({
  label,
  value,
  current,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  current: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <input
          className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-right text-[11px] text-foreground"
          value={value}
          readOnly
        />
      </div>
      <div className="relative h-1.5 rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          style={{ width: `${current}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-sm"
          style={{ left: `${current}%` }}
        />
      </div>
    </div>
  );
}

// ----------- 底部相册条 -----------
function BottomPhotoStrip() {
  return (
    <footer className="flex h-24 shrink-0 items-center gap-3 border-t border-border bg-card px-4">
      {/* 上传按钮 */}
      <button className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
        <Plus className="h-5 w-5" />
        <span className="text-[10px] font-medium">添加</span>
      </button>

      {/* 分隔 */}
      <div className="h-12 w-px bg-border" />

      {/* 已上传缩略图 */}
      <div className="flex flex-1 items-center gap-2 overflow-x-auto">
        {PHOTOS.map((photo) => (
          <div
            key={photo.id}
            className={cn(
              "group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-secondary transition-all",
              photo.selected
                ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]"
                : photo.used
                ? "border-accent/50"
                : "border-border hover:border-primary/40"
            )}
          >
            <img
              src={PHOTO(photo.seed)}
              alt=""
              className="h-full w-full object-cover"
            />

            {/* 已使用标记 */}
            {photo.used && (
              <span
                className={cn(
                  "absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white shadow-sm",
                  photo.selected ? "bg-primary" : "bg-accent"
                )}
              >
                <Check className="h-2.5 w-2.5" />
              </span>
            )}

            {/* hover 浮层 */}
            <div className="absolute inset-x-0 bottom-0 flex h-5 items-center justify-center bg-gradient-to-t from-black/70 to-transparent text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {photo.used ? "已使用" : "拖入或点击"}
            </div>
          </div>
        ))}
      </div>

      {/* 状态信息 */}
      <div className="ml-auto shrink-0 text-right">
        <div className="text-xs font-semibold text-foreground">7 张照片</div>
        <div className="text-[11px] text-muted-foreground">3 已使用 · 4 待用</div>
      </div>
    </footer>
  );
}

// ----------- 顶部对比说明条 -----------
function MockupBanner() {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-amber-200 bg-amber-50 px-4 text-xs text-amber-900">
      <div className="flex items-center gap-2">
        <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          Mockup
        </span>
        <span>这是 /collage 改版的视觉演示，仅作设计评审，未接入数据</span>
      </div>
      <div className="flex items-center gap-3">
        <a href="collage" className="text-amber-700 underline hover:text-amber-900">
          ← 现有版本
        </a>
        <a
          href="#annotations"
          className="rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 hover:bg-amber-200"
        >
          查看设计说明 ↓
        </a>
      </div>
    </div>
  );
}

// ----------- 底部设计说明 -----------
function DesignAnnotations() {
  const items = [
    {
      title: "顶栏 56px",
      body: "标题可重命名 + 自动保存提示 · 撤销/重做 · 主操作（下载）。把过去 toolbar 里的 H1、副标题、状态徽章、上传按钮全部移除。",
    },
    {
      title: "左侧 64px Icon Rail",
      body: "5 个核心工具：模板 / 比例 / 边距背景 / 滤镜 / 设置。点击展开 240px flyout，再次点击折叠。一直可见、不占常驻空间。",
    },
    {
      title: "中央画布",
      body: "成为视觉主角，占据 ~50% 宽度。空格子用大号「+ 拖拽或点击」引导；选中图片显示角点 + 浮动工具条（适应/填满/旋转/翻转/替换/删除），编辑动作离手最近。",
    },
    {
      title: "右侧 280px 上下文面板",
      body: "选中图片时出现：缩略预览 + 一行替换按钮 + 4 个快捷动作 + 缩放/旋转滑条 + 滤镜折叠区。未选中时折叠为提示卡片或彻底隐藏。",
    },
    {
      title: "底部 96px 相册条",
      body: "全程可见的缩略图横滑列表。已使用打勾（绿/蓝）、未用正常态。点击 = 自动填空位 · 拖拽 = 放指定格 · 长按出菜单。彻底取代左侧那个被压扁的图片列表。",
    },
    {
      title: "智能提示条",
      body: "上传后或差一张图时自动出现：「还有 1 个空位 · 自动填入剩下的照片?」。一键填充，去除「美化模式 / 极致模式」这种用户看不懂的开关。",
    },
  ];

  return (
    <section
      id="annotations"
      className="border-t border-border bg-card px-8 py-10"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-lg font-semibold text-foreground">设计说明</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          下面 6 个区块对应上方 mockup 中的核心结构与设计意图。
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
          <h3 className="text-sm font-semibold text-foreground">交互层 vs 现版差异</h3>
          <ul className="mt-3 space-y-1.5 text-xs leading-6 text-foreground">
            <li>· <strong>直接操作 vs 滑条</strong>：选中图片在画布上直接拖角点缩放、拖图平移视野，滑条沦为可选。</li>
            <li>· <strong>底部相册条 vs 左侧列表</strong>：照片始终可见，不用切换面板找。</li>
            <li>· <strong>浮动工具条 vs 侧栏滑条</strong>：编辑操作离选中图片最近，节省鼠标移动。</li>
            <li>· <strong>智能填充 vs 手动拖每一张</strong>：一键完成 80% 场景。</li>
            <li>· <strong>撤销重做 + 自动保存</strong>：解除「拖错就回不去」的恐惧。</li>
            <li>· <strong>键盘快捷键</strong>：Delete 删除 · ⌘Z 撤销 · ⌘D 下载 · 方向键微调 · R 旋转 90°。</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ----------- 主页面 -----------
export default function CollageMockupPage() {
  const [activeTool, setActiveTool] = useState<ToolId>("templates");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MockupBanner />

      <div className="flex h-[calc(100vh-2.25rem)] min-h-[760px] flex-col">
        <TopBar />
        <div className="flex flex-1 min-h-0">
          <LeftRail active={activeTool} onSelect={setActiveTool} />
          {activeTool === "templates" && <TemplatesFlyout />}
          <CanvasArea />
          <RightContextPanel />
        </div>
        <BottomPhotoStrip />
      </div>

      <DesignAnnotations />
    </div>
  );
}
