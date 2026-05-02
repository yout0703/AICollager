"use client";

import { AspectRatio } from "./constants";
import { cn } from "@/lib/utils";

interface AspectRatioSelectorProps {
  aspectRatios: AspectRatio[];
  selectedAspectRatio: AspectRatio;
  onSelectAspectRatio: (aspectRatio: AspectRatio) => void;
  translateFn: (key: string) => string;
}

export default function AspectRatioSelector({
  aspectRatios,
  selectedAspectRatio,
  onSelectAspectRatio,
  translateFn
}: AspectRatioSelectorProps) {
  const getRatioLabel = (aspectRatio: AspectRatio) => {
    const key = `aspectRatioLabels.${aspectRatio.id}`;
    const translated = translateFn(key);
    return translated === key ? aspectRatio.description : translated;
  };
  const getPreviewStyle = (aspectRatio: AspectRatio) => {
    if (aspectRatio.ratio >= 1) {
      return {
        width: "34px",
        height: `${Math.max(18, 34 / aspectRatio.ratio)}px`
      };
    }

    return {
      width: `${Math.max(18, 42 * aspectRatio.ratio)}px`,
      height: "42px"
    };
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{translateFn('chooseAspectRatio')}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {translateFn('collageWorkspace.aspectRatioDescription')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {aspectRatios.map(aspectRatio => (
          <button
            key={aspectRatio.id}
            type="button"
            onClick={() => onSelectAspectRatio(aspectRatio)}
            className={cn(
              "flex min-h-[76px] items-center gap-3 rounded-md border bg-background p-3 text-left transition-colors hover:border-primary/60",
              selectedAspectRatio.id === aspectRatio.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-foreground"
            )}
            title={getRatioLabel(aspectRatio)}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-secondary">
              <span
                className="rounded-sm bg-primary/15 ring-4 ring-background/70"
                style={getPreviewStyle(aspectRatio)}
              />
            </div>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{aspectRatio.name}</span>
              <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
                {getRatioLabel(aspectRatio)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
