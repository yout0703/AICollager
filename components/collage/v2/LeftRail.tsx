"use client";

import { Frame, HelpCircle, LayoutGrid, Palette, Settings, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ToolId, TranslateFn } from "./types";

interface LeftRailProps {
  active: ToolId | null;
  onSelect: (tool: ToolId | null) => void;
  translateFn: TranslateFn;
}

const TOOLS: Array<{
  id: ToolId;
  icon: typeof LayoutGrid;
  label: string;
}> = [
  { id: "templates", icon: LayoutGrid, label: "模板" },
  { id: "aspect", icon: Frame, label: "画布" },
  { id: "background", icon: Palette, label: "背景" },
  { id: "effects", icon: Sparkles, label: "滤镜" },
  { id: "settings", icon: Settings, label: "设置" },
];

export default function LeftRail(props: LeftRailProps): JSX.Element {
  const { active, onSelect } = props;

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
          onClick={() => undefined}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="快捷键"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>
      </div>
    </nav>
  );
}
