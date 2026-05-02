"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Dictionary, Locale, getTranslation } from "@/lib/i18n";
import { toastMessage } from "@/lib/toast";
import {
  CollageImage,
  DEFAULT_ASPECT_RATIOS,
  DEFAULT_IMAGE_TRANSFORM,
  DEFAULT_LAYOUTS,
  ImageTransform,
  getLayoutCellCount,
  normalizeImageTransform,
} from "../constants";
import { useCollageHistory } from "./useCollageHistory";
import type { CollageSnapshot, SizeMap, ToolId } from "./types";

// Child components
import TopBar from "./TopBar";
import LeftRail from "./LeftRail";
import Flyout from "./Flyout";
import Canvas from "./Canvas";
import RightPanel from "./RightPanel";
import BottomPhotoStrip from "./BottomPhotoStrip";
import SmartFillBanner from "./SmartFillBanner";
import { generateCollageImage } from "../utils/canvasUtils";

interface CollageWorkspaceProps {
  dict: Dictionary;
  locale: Locale;
}

const INITIAL_SNAPSHOT: CollageSnapshot = {
  images: [],
  layout: DEFAULT_LAYOUTS[1], // 2x2 default
  aspectRatio: DEFAULT_ASPECT_RATIOS[0], // 1:1
  cellGap: 0, // 0 = WYSIWYG with export
};

export default function CollageWorkspace({ dict, locale }: CollageWorkspaceProps) {
  const { isSignedIn, user } = useUser();
  const t = useCallback((key: string): string => getTranslation(dict, key), [dict]);

  // History-tracked state
  const { snapshot, commit, setTransient, flushTransient, undo, redo, canUndo, canRedo } =
    useCollageHistory(INITIAL_SNAPSHOT);
  const { images, layout, aspectRatio, cellGap } = snapshot;

  // UI-only state (not in history)
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [draggedImage, setDraggedImage] = useState<CollageImage | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [_showRating, setShowRating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [smartFillDismissed, setSmartFillDismissed] = useState(false);

  // Lifted size state — Canvas reports back into here so RightPanel can read it.
  const [sizes, setSizes] = useState<SizeMap>({ images: {}, cells: {} });

  const collageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  // ----- Derived -----
  const totalCells = getLayoutCellCount(layout);
  const placedCount = useMemo(
    () => images.filter((img) => img.position !== undefined).length,
    [images]
  );
  const emptyCount = totalCells - placedCount;
  const unplacedCount = images.length - placedCount;
  const selectedImage = useMemo(
    () => images.find((img) => img.id === selectedImageId),
    [images, selectedImageId]
  );

  // ----- File upload -----
  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newImages: CollageImage[] = Array.from(files).map((file) => ({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
        transform: { ...DEFAULT_IMAGE_TRANSFORM },
      }));

      // Auto-fill empty cells with the new images
      const filledPositions = new Set(
        images.map((img) => img.position).filter((p): p is number => p !== undefined)
      );
      const emptyPositions: number[] = [];
      for (let i = 0; i < totalCells; i++) {
        if (!filledPositions.has(i)) emptyPositions.push(i);
      }

      const placed = newImages.map((img, i) =>
        i < emptyPositions.length ? { ...img, position: emptyPositions[i] } : img
      );

      commit((prev) => ({ ...prev, images: [...prev.images, ...placed] }));
      toastMessage(t("imagesUploaded"), "success");
    },
    [images, totalCells, commit, t]
  );

  // ----- Place an unplaced photo into the next empty cell -----
  const handleAddToPreview = useCallback(
    (image: CollageImage) => {
      const filledPositions = new Set(
        images.map((img) => img.position).filter((p): p is number => p !== undefined)
      );
      let target = -1;
      for (let i = 0; i < totalCells; i++) {
        if (!filledPositions.has(i)) {
          target = i;
          break;
        }
      }
      if (target === -1) {
        toastMessage(t("noEmptyPosition"), "warning");
        return;
      }
      commit((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === image.id ? { ...img, position: target } : img
        ),
      }));
    },
    [images, totalCells, commit, t]
  );

  // ----- Drag & drop into a specific cell -----
  const handleDrop = useCallback(
    (position: number) => {
      if (!draggedImage) return;
      const draggedId = draggedImage.id;

      commit((prev) => {
        const result = [...prev.images];
        const draggedIdx = result.findIndex((img) => img.id === draggedId);
        if (draggedIdx === -1) return prev;
        const targetIdx = result.findIndex((img) => img.position === position);

        if (targetIdx !== -1 && targetIdx !== draggedIdx) {
          if (result[draggedIdx].position !== undefined) {
            const oldPos = result[draggedIdx].position;
            result[draggedIdx] = { ...result[draggedIdx], position };
            result[targetIdx] = { ...result[targetIdx], position: oldPos };
          } else {
            result[draggedIdx] = { ...result[draggedIdx], position };
            // Find an empty cell for the bumped image
            let emptyPos = -1;
        for (let i = 0; i < getLayoutCellCount(prev.layout); i++) {
              if (i !== position && !result.some((img) => img.position === i)) {
                emptyPos = i;
                break;
              }
            }
            result[targetIdx] = {
              ...result[targetIdx],
              position: emptyPos !== -1 ? emptyPos : undefined,
            };
          }
        } else {
          result[draggedIdx] = { ...result[draggedIdx], position };
        }

        return { ...prev, images: result };
      });

      setDraggedImage(null);
      setDraggedOver(null);
    },
    [draggedImage, commit]
  );

  // ----- Remove from cell (keeps in upload list) -----
  const handleRemoveFromPreview = useCallback(
    (id: string) => {
      if (id === selectedImageId) setSelectedImageId(null);
      commit((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === id ? { ...img, position: undefined } : img
        ),
      }));
    },
    [selectedImageId, commit]
  );

  // ----- Remove entirely (from upload list) -----
  const handleRemoveImage = useCallback(
    (id: string) => {
      if (id === selectedImageId) setSelectedImageId(null);
      const target = images.find((img) => img.id === id);
      if (!target) return;
      if (target.position !== undefined) {
        // Just unplace
        commit((prev) => ({
          ...prev,
          images: prev.images.map((img) =>
            img.id === id ? { ...img, position: undefined } : img
          ),
        }));
      } else {
        // Fully remove
        commit((prev) => ({
          ...prev,
          images: prev.images.filter((img) => img.id !== id),
        }));
      }
    },
    [images, selectedImageId, commit]
  );

  // ----- Transform updates -----
  const handleUpdateTransform = useCallback(
    (id: string, transform: ImageTransform) => {
      setTransient((prev) => ({
        ...prev,
        images: prev.images.map((img) => (img.id === id ? { ...img, transform } : img)),
      }));
    },
    [setTransient]
  );

  const handleCommitTransform = useCallback(() => {
    flushTransient();
  }, [flushTransient]);

  // ----- Layout / aspect ratio changes -----
  const handleSelectLayout = useCallback(
    (newLayout: typeof layout) => {
      commit((prev) => {
        const newCells = getLayoutCellCount(newLayout);
        const trimmedImages = prev.images.map((img) =>
          img.position !== undefined && img.position >= newCells
            ? { ...img, position: undefined }
            : img
        );
        return { ...prev, layout: newLayout, images: trimmedImages };
      });
    },
    [commit]
  );

  const handleSelectAspectRatio = useCallback(
    (newRatio: typeof aspectRatio) => {
      commit((prev) => ({
        ...prev,
        aspectRatio: newRatio,
        images: prev.images.map((img) => ({
          ...img,
          transform: normalizeImageTransform(img.transform),
        })),
      }));
    },
    [commit]
  );

  const handleCellGapChange = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(32, Math.round(value)));
      setTransient((prev) => ({ ...prev, cellGap: clamped }));
    },
    [setTransient]
  );

  // ----- Smart-fill: auto-distribute unplaced photos -----
  const handleSmartFill = useCallback(() => {
    commit((prev) => {
      const filled = new Set(
        prev.images.map((i) => i.position).filter((p): p is number => p !== undefined)
      );
      const empties: number[] = [];
      for (let i = 0; i < getLayoutCellCount(prev.layout); i++) {
        if (!filled.has(i)) empties.push(i);
      }
      const unplaced = prev.images.filter((i) => i.position === undefined);
      const updates = new Map(unplaced.slice(0, empties.length).map((img, i) => [img.id, empties[i]]));
      return {
        ...prev,
        images: prev.images.map((img) =>
          updates.has(img.id) ? { ...img, position: updates.get(img.id) } : img
        ),
      };
    });
    setSmartFillDismissed(true);
  }, [commit]);

  // ----- Replace a placed image with a freshly uploaded file -----
  const handleReplaceClick = useCallback((id: string) => {
    replaceTargetRef.current = id;
    replaceInputRef.current?.click();
  }, []);

  const handleReplaceFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const targetId = replaceTargetRef.current;
      e.target.value = "";
      replaceTargetRef.current = null;
      if (!file || !targetId) return;

      const newImage: CollageImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
        transform: { ...DEFAULT_IMAGE_TRANSFORM },
      };

      commit((prev) => {
        const old = prev.images.find((i) => i.id === targetId);
        if (!old) return prev;
        const targetPos = old.position;
        // Replace at the same position; old image becomes unplaced (kept in strip)
        const placedNew: CollageImage = { ...newImage, position: targetPos };
        return {
          ...prev,
          images: [
            ...prev.images.map((i) =>
              i.id === targetId ? { ...i, position: undefined } : i
            ),
            placedNew,
          ],
        };
      });
      setSelectedImageId(newImage.id);
    },
    [commit]
  );

  // ----- Quick transform actions -----
  const applyTransformAction = useCallback(
    (action: "fit" | "fill" | "rotate90" | "flip" | "reset") => {
      if (!selectedImageId) return;
      commit((prev) => ({
        ...prev,
        images: prev.images.map((img) => {
          if (img.id !== selectedImageId) return img;
          const cur = img.transform || DEFAULT_IMAGE_TRANSFORM;
          let next: ImageTransform;
          switch (action) {
            case "fit":
              next = {
                ...cur,
                offsetX: 0.5,
                offsetY: 0.5,
                scale: 1,
                keepAspectRatio: true,
                fitMode: "contain",
              };
              break;
            case "fill":
              next = {
                ...cur,
                offsetX: 0.5,
                offsetY: 0.5,
                scale: 1,
                keepAspectRatio: true,
                fitMode: "cover",
              };
              break;
            case "rotate90":
              next = { ...cur, rotation: cur.rotation + Math.PI / 2 };
              break;
            case "flip":
              next = { ...cur, scale: -Math.abs(cur.scale) === cur.scale ? Math.abs(cur.scale) : -Math.abs(cur.scale) };
              break;
            case "reset":
              next = { ...DEFAULT_IMAGE_TRANSFORM };
              break;
            default:
              next = cur;
          }
          return { ...img, transform: next };
        }),
      }));
    },
    [selectedImageId, commit]
  );

  // ----- Download -----
  const handleDownload = useCallback(async () => {
    if (!collageRef.current) return;
    if (!isSignedIn) {
      toastMessage(t("loginRequired"), "info");
      try {
        const collageState = {
          selectedLayout: layout,
          selectedAspectRatio: aspectRatio,
          cellGap,
          images: images.map((img) => ({ id: img.id, url: img.url, position: img.position })),
        };
        localStorage.setItem("collageState", JSON.stringify(collageState));
        setShowLoginModal(true);
      } catch (error) {
        console.error("保存拼图状态失败:", error);
        setShowLoginModal(true);
      }
      return;
    }

    try {
      setIsDownloading(true);
      const dataUrl = await generateCollageImage(
        collageRef.current,
        images,
        layout,
        aspectRatio,
        cellGap
      );

      const link = document.createElement("a");
      link.download = `collage-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toastMessage(t("downloadSuccess"), "success");
      requestAnimationFrame(() => setShowRating(true));
    } catch (error) {
      console.error("下载失败：", error);
      toastMessage(t("downloadFailed"), "error");
    } finally {
      setIsDownloading(false);
    }
  }, [isSignedIn, t, images, layout, aspectRatio, cellGap]);

  // ----- Restore from localStorage on login return -----
  useEffect(() => {
    const shouldRestore = window.location.search.includes("return=true");
    if (isSignedIn && shouldRestore) {
      try {
        const saved = localStorage.getItem("collageState");
        if (saved) {
          const parsed = JSON.parse(saved);
          commit({
            layout: parsed.selectedLayout ?? layout,
            aspectRatio: parsed.selectedAspectRatio ?? aspectRatio,
            cellGap: typeof parsed.cellGap === "number" ? parsed.cellGap : 0,
            images:
              parsed.images?.map((img: { id: string; url: string; position?: number }) => ({
                id: img.id,
                url: img.url,
                position: img.position,
              })) ?? [],
          });
          toastMessage(t("collageRestored"), "success");
          localStorage.removeItem("collageState");
          window.history.replaceState({}, document.title, `/${locale}/collage`);
        }
      } catch (error) {
        console.error("恢复拼图状态失败:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, locale]);

  // ----- Auto-close login modal after sign-in -----
  useEffect(() => {
    if (isSignedIn && showLoginModal) setShowLoginModal(false);
  }, [isSignedIn, showLoginModal]);

  // ----- Global pointer-up: flush any in-progress transient state into history -----
  useEffect(() => {
    const handler = () => flushTransient();
    window.addEventListener("pointerup", handler);
    window.addEventListener("keyup", handler);
    return () => {
      window.removeEventListener("pointerup", handler);
      window.removeEventListener("keyup", handler);
    };
  }, [flushTransient]);

  // ----- Keyboard shortcuts -----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isEditable) return;

      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((meta && e.key.toLowerCase() === "y") || (meta && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedImageId) {
          e.preventDefault();
          handleRemoveFromPreview(selectedImageId);
        }
      } else if (e.key === "Escape") {
        if (selectedImageId) setSelectedImageId(null);
        else if (activeTool) setActiveTool(null);
      } else if (e.key.toLowerCase() === "r" && selectedImageId) {
        e.preventDefault();
        applyTransformAction("rotate90");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedImageId, activeTool, handleRemoveFromPreview, applyTransformAction]);

  const _handleSubmitRating = useCallback(
    async (rating: number, comment: string) => {
      if (!isSignedIn || !user) {
        toastMessage(t("loginRequired"), "error");
        return;
      }
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("评分提交:", {
          rating,
          comment,
          userId: user.id,
          userEmail: user.primaryEmailAddress?.emailAddress,
        });
        toastMessage(t("ratingSubmitted"), "success");
        setShowRating(false);
      } catch {
        toastMessage(t("ratingFailed"), "error");
      }
    },
    [isSignedIn, user, t]
  );

  const showSmartFill = !smartFillDismissed && unplacedCount > 0 && emptyCount > 0;

  return (
    <div className="flex h-screen min-h-[760px] flex-col overflow-hidden bg-background">
      <TopBar
        translateFn={t}
        locale={locale}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onDownload={handleDownload}
        canDownload={images.some((img) => img.position !== undefined)}
        isDownloading={isDownloading}
      />

      <div className="flex min-h-0 flex-1">
        <LeftRail active={activeTool} onSelect={setActiveTool} translateFn={t} />

        {activeTool && (
          <Flyout
            tool={activeTool}
            onClose={() => setActiveTool(null)}
            translateFn={t}
            layout={layout}
            aspectRatio={aspectRatio}
            cellGap={cellGap}
            onSelectLayout={handleSelectLayout}
            onSelectAspectRatio={handleSelectAspectRatio}
            onCellGapChange={handleCellGapChange}
          />
        )}

        <Canvas
          images={images}
          layout={layout}
          aspectRatio={aspectRatio}
          cellGap={cellGap}
          selectedImageId={selectedImageId}
          draggedOver={draggedOver}
          onDragOver={(e, position) => {
            e.preventDefault();
            setDraggedOver(position);
          }}
          onDrop={handleDrop}
          onSelectImage={(id) => setSelectedImageId(id)}
          onCellClick={() => fileInputRef.current?.click()}
          onRemoveFromCell={handleRemoveFromPreview}
          onQuickAction={applyTransformAction}
          onReplace={handleReplaceClick}
          onUpdateTransform={handleUpdateTransform}
          onCommitTransform={handleCommitTransform}
          onSizesChange={setSizes}
          translateFn={t}
          collageRef={collageRef}
        />

        <RightPanel
          selectedImage={selectedImage}
          placedCount={placedCount}
          totalCells={totalCells}
          sizes={sizes}
          onUpdateTransform={handleUpdateTransform}
          onCommitTransform={handleCommitTransform}
          onQuickAction={applyTransformAction}
          onReplace={handleReplaceClick}
          onClose={() => setSelectedImageId(null)}
          isToolOpen={Boolean(activeTool)}
          translateFn={t}
        />
      </div>

      <BottomPhotoStrip
        images={images}
        selectedImageId={selectedImageId}
        draggedImageId={draggedImage?.id ?? null}
        onUploadClick={() => fileInputRef.current?.click()}
        onAddToPreview={handleAddToPreview}
        onRemoveImage={handleRemoveImage}
        onDragStart={setDraggedImage}
        onDragEnd={() => {
          setDraggedImage(null);
          setDraggedOver(null);
        }}
        translateFn={t}
      />

      {showSmartFill && (
        <SmartFillBanner
          unplacedCount={unplacedCount}
          emptyCount={emptyCount}
          onAccept={handleSmartFill}
          onDismiss={() => setSmartFillDismissed(true)}
          translateFn={t}
        />
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        ref={fileInputRef}
      />
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleReplaceFileChange}
        ref={replaceInputRef}
      />

      {/* Login modal (kept minimal — same behavior as legacy) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md rounded-lg bg-card p-4">
            <button
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowLoginModal(false)}
            >
              ×
            </button>
            <div className="py-4">
              <SignInButton mode="modal" fallbackRedirectUrl={`/${locale}/collage`} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
