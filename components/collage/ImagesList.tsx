"use client";

import { CollageImage } from "./constants";

interface ImagesListProps {
  images: CollageImage[];
  onDragStart: (image: CollageImage) => void;
  onDragEnd: () => void;
  onRemoveImage: (id: string) => void;
  onAddToPreview: (image: CollageImage) => void;
  translateFn?: (key: string) => string;
}

export default function ImagesList({
  images,
  onDragStart,
  onDragEnd,
  onRemoveImage,
  onAddToPreview,
  translateFn = (key: string) => key
}: ImagesListProps) {
  // 获取翻译文本
  const t = (key: string): string => {
    return translateFn(key);
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
      <h3 className="text-sm font-medium mb-1">{t("uploadedImages")}</h3>
      <p className="text-xs text-gray-500 mb-2">{t("dragOrClickInstructions")}</p>
      
      {images.length === 0 ? (
        <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-sm text-gray-500">{t("pleaseUploadImages")}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-1">
          {images.map(image => (
            <div 
              key={image.id}
              className="relative w-16 h-16 border rounded-md overflow-hidden group"
              draggable
              onDragStart={() => onDragStart(image)}
              onDragEnd={onDragEnd}
            >
              <img
                src={image.url}
                alt={t("uploadedImage")}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex flex-col justify-between">
                <button
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1"
                  onClick={() => onRemoveImage(image.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onAddToPreview(image)}
                >
                  {t("addToPreview")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 