"use client";

import { Wand2 } from "lucide-react";
import type { TranslateFn } from "./types";

interface SmartFillBannerProps {
  unplacedCount: number;
  emptyCount: number;
  onAccept: () => void;
  onDismiss: () => void;
  translateFn: TranslateFn;
}

export default function SmartFillBanner(props: SmartFillBannerProps): JSX.Element {
  const { unplacedCount, emptyCount, onAccept, onDismiss } = props;
  const fillCount = Math.min(unplacedCount, emptyCount);

  return (
    <div className="fixed bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-md">
      <Wand2 className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-medium text-foreground">
        还有 {emptyCount} 个空位 · 自动填入 {fillCount} 张照片?
      </span>
      <button
        type="button"
        className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        onClick={onAccept}
      >
        一键填充
      </button>
      <button
        type="button"
        className="ml-1 flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}
