import type { AspectRatio, CollageImage, ImageTransform, Layout } from "../constants";

export type ToolId = "templates" | "aspect" | "background" | "effects" | "settings";

export interface CollageSnapshot {
  images: CollageImage[];
  layout: Layout;
  aspectRatio: AspectRatio;
  /** Spacing in CSS pixels between cells (and around the grid). Default 0 = WYSIWYG with export. */
  cellGap: number;
}

export interface SizeMap {
  /** Natural dimensions of each loaded image, keyed by image id. */
  images: Record<string, { width: number; height: number }>;
  /** Rendered dimensions of each cell in the canvas, keyed by position. */
  cells: Record<number, { width: number; height: number }>;
}

export type TranslateFn = (key: string) => string;

export interface DownloadStats {
  imageCount: number;
  placedCount: number;
  emptyCount: number;
  totalCells: number;
}

export type { AspectRatio, CollageImage, ImageTransform, Layout };
