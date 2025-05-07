"use client";

import Image from "next/image";
import { CollageImage } from "./constants";

interface CollageImageListProps {
  images: CollageImage[];
  onDragStart: (image: CollageImage) => void;
  onDragEnd: () => void;
  onRemoveImage: (id: string) => void;
  onAddToPreview?: (image: CollageImage) => void;
  title: string;
}

export default function CollageImageList({
  images,
  onDragStart,
  onDragEnd,
  onRemoveImage,
  onAddToPreview,
  title
}: CollageImageListProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="flex flex-wrap gap-3">
        {images.map(image => (
          <div 
            key={image.id}
            className="relative w-16 h-16 sm:w-20 sm:h-20 border rounded-md overflow-hidden group"
            draggable
            onDragStart={() => onDragStart(image)}
            onDragEnd={onDragEnd}
          >
            <Image
              src={image.url}
              alt="Uploaded image"
              fill
              className="object-cover"
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
              {onAddToPreview && (
                <button
                  className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onAddToPreview(image)}
                >
                  添加到预览
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 