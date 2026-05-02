"use client";

import { Check, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CollageImage, TranslateFn } from "./types";

interface BottomPhotoStripProps {
  images: CollageImage[];
  selectedImageId: string | null;
  draggedImageId: string | null;
  onUploadClick: () => void;
  onAddToPreview: (image: CollageImage) => void;
  onRemoveImage: (id: string) => void;
  onDragStart: (image: CollageImage) => void;
  onDragEnd: () => void;
  translateFn: TranslateFn;
}

export default function BottomPhotoStrip(
  props: BottomPhotoStripProps
): JSX.Element {
  const placedCount = props.images.filter(
    (image) => image.position !== undefined
  ).length;
  const unplacedCount = props.images.length - placedCount;

  return (
    <footer className="flex h-24 w-full shrink-0 items-center gap-3 border-t border-border bg-card px-4">
      <button
        type="button"
        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        onClick={props.onUploadClick}
      >
        <Plus className="h-5 w-5" />
        <span className="text-[10px] font-medium">添加</span>
      </button>

      <div className="h-12 w-px bg-border" />

      {props.images.length === 0 ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-sm text-muted-foreground">
          还没有上传照片 — 拖拽照片到这里，或者点击左边的「添加」
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {props.images.map((image) => {
            const isSelected = props.selectedImageId === image.id;
            const isUsed = image.position !== undefined;
            const isDragging = props.draggedImageId === image.id;

            return (
              <div
                key={image.id}
                className={cn(
                  "group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border bg-background transition-all",
                  isSelected
                    ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]"
                    : isUsed
                      ? "border-accent/50"
                      : "border-border hover:border-primary/40",
                  isDragging && "opacity-60"
                )}
                draggable
                onClick={() => props.onAddToPreview(image)}
                onDragStart={() => props.onDragStart(image)}
                onDragEnd={props.onDragEnd}
              >
                <img
                  src={image.url}
                  alt=""
                  className="h-full w-full object-cover"
                />

                {isUsed && (
                  <span
                    className={cn(
                      "absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm",
                      isSelected ? "bg-primary" : "bg-accent"
                    )}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}

                <button
                  type="button"
                  className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-card/95 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onRemoveImage(image.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>

                <div className="absolute inset-x-0 bottom-0 flex h-5 items-center justify-center bg-gradient-to-t from-black/70 to-transparent text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {isUsed ? "已使用" : "拖入或点击"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {props.images.length > 0 && (
        <div className="ml-auto shrink-0 text-right">
          <div className="text-xs font-semibold text-foreground">
            {props.images.length} 张照片
          </div>
          <div className="text-[11px] text-muted-foreground">
            {placedCount} 已使用 · {unplacedCount} 待用
          </div>
        </div>
      )}
    </footer>
  );
}
