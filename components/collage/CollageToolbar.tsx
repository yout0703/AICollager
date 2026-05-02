"use client";

import { Download, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollageToolbarProps {
  onUploadClick: () => void;
  onDownloadClick: () => void;
  isDownloading: boolean;
  hasImages: boolean;
  imageCount: number;
  placedCount: number;
  aspectRatioName: string;
  translateFn: (key: string) => string;
}

export default function CollageToolbar({
  onUploadClick,
  onDownloadClick,
  isDownloading,
  hasImages,
  imageCount,
  placedCount,
  aspectRatioName,
  translateFn
}: CollageToolbarProps) {
  return (
    <div className="mb-5 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <ImageIcon className="h-4 w-4" />
            {translateFn('collageWorkspace.status')}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            {translateFn('collageButton')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {translateFn('collageWorkspace.subtitle')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border border-border bg-secondary/60 px-2.5 py-1">
              {imageCount} {translateFn('collageWorkspace.photos')}
            </span>
            <span className="rounded-md border border-border bg-secondary/60 px-2.5 py-1">
              {placedCount} {translateFn('collageWorkspace.placed')}
            </span>
            <span className="rounded-md border border-border bg-secondary/60 px-2.5 py-1">
              {aspectRatioName} {translateFn('collageWorkspace.canvas')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={onUploadClick}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{translateFn('uploadButton')}</span>
            <span className="sm:hidden">{translateFn('collageWorkspace.uploadMobile')}</span>
          </Button>

          <Button
            className="gap-2"
            onClick={onDownloadClick}
            disabled={isDownloading || !hasImages}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{translateFn('downloadButton')}</span>
            <span className="sm:hidden">{translateFn('collageWorkspace.downloadMobile')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
