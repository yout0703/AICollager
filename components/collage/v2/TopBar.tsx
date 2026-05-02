"use client";

import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Loader2,
  Redo2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import type { TranslateFn } from "./types";

interface TopBarProps {
  translateFn: TranslateFn;
  locale: Locale;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  canDownload: boolean;
  isDownloading: boolean;
}

export default function TopBar(props: TopBarProps): JSX.Element {
  const downloadDisabled = !props.canDownload || props.isDownloading;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link
          href={`/${props.locale}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-5 w-px bg-border" />
        <div>
          <div className="text-sm font-semibold text-foreground">我的拼图</div>
          <div className="text-[11px] text-muted-foreground">已自动保存</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          title="撤销 (Cmd+Z)"
          onClick={props.onUndo}
          disabled={!props.canUndo}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            !props.canUndo && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground",
          )}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="重做 (Cmd+Shift+Z)"
          onClick={props.onRedo}
          disabled={!props.canRedo}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            !props.canRedo && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground",
          )}
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => undefined}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          预览
        </button>
        <button
          type="button"
          onClick={props.onDownload}
          disabled={downloadDisabled}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90",
            !props.canDownload && "cursor-not-allowed opacity-40 hover:bg-primary",
            props.isDownloading && "cursor-wait hover:bg-primary",
          )}
        >
          {props.isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          下载
          <span className="ml-1 h-3 w-px bg-primary-foreground/30" />
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </header>
  );
}
