"use client";

import { CollageImage } from "./constants";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagesListProps {
  images: CollageImage[];
  onDragStart: (image: CollageImage) => void;
  onDragEnd: () => void;
  onRemoveImage: (id: string) => void;
  onAddToPreview: (image: CollageImage) => void;
  onUploadClick: () => void;
  translateFn?: (key: string) => string;
}

export default function ImagesList({
  images,
  onDragStart,
  onDragEnd,
  onRemoveImage,
  onAddToPreview,
  onUploadClick,
  translateFn = (key: string) => key
}: ImagesListProps) {
  // 获取翻译文本
  const t = (key: string): string => {
    return translateFn(key);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("collageWorkspace.sourceImages")}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("collageWorkspace.sourceImagesDescription")}
          </p>
        </div>
        <span className="rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs text-muted-foreground">
          {images.length}
        </span>
      </div>

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-background text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            {t("collageWorkspace.uploadEmptyTitle")}
          </h4>
          <p className="mx-auto mt-1 max-w-[220px] text-xs leading-5 text-muted-foreground">
            {t("collageWorkspace.uploadEmptyDescription")}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-4 gap-2"
            onClick={onUploadClick}
          >
            <Upload className="h-4 w-4" />
            {t("collageWorkspace.uploadEmptyAction")}
          </Button>
        </div>
      ) : (
        <div className="grid max-h-[260px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5 lg:grid-cols-4">
          {images.map(image => (
            <div
              key={image.id}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-md border bg-secondary",
                image.position !== undefined ? "border-primary/60" : "border-border"
              )}
              draggable
              onDragStart={() => onDragStart(image)}
              onDragEnd={onDragEnd}
            >
              <img
                src={image.url}
                alt={t("uploadedImage")}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
                crossOrigin={image.url.startsWith('data:') ? undefined : "anonymous"}
              />
              {image.position !== undefined && (
                <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  <Check className="inline h-3 w-3" />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col justify-between bg-black/0 transition-colors group-hover:bg-black/35">
                <button
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover:opacity-100"
                  onClick={() => onRemoveImage(image.id)}
                  title={t("removeImage")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded bg-background/95 px-2 py-1 text-[11px] font-medium text-foreground opacity-0 shadow-sm transition-opacity hover:text-primary group-hover:opacity-100"
                  onClick={() => onAddToPreview(image)}
                >
                  <Plus className="h-3 w-3" />
                  {image.position !== undefined ? t("collageWorkspace.inCanvas") : t("collageWorkspace.addImage")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
