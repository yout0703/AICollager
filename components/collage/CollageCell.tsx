"use client";

import Image from "next/image";
import { CollageImage } from "./constants";

interface CollageCellProps {
  position: number;
  image?: CollageImage;
  onDragOver: (e: React.DragEvent, position: number) => void;
  onDrop: (position: number) => void;
  draggedOver: number | null;
  onRemoveImage: (id: string) => void;
  dragText: string;
}

export default function CollageCell({
  position,
  image,
  onDragOver,
  onDrop,
  draggedOver,
  onRemoveImage,
  dragText
}: CollageCellProps) {
  return (
    <div 
      key={`cell-${position}`}
      className={`relative border border-gray-200 bg-gray-50 aspect-square ${
        draggedOver === position ? 'bg-blue-50 border-blue-200' : ''
      }`}
      onDragOver={(e) => onDragOver(e, position)}
      onDrop={() => onDrop(position)}
    >
      {image ? (
        <div className="relative w-full h-full group">
          <Image
            src={image.url}
            alt="Uploaded image"
            fill
            className="object-cover"
          />
          <button
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemoveImage(image.id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <p className="text-sm text-center px-2">{dragText}</p>
        </div>
      )}
    </div>
  );
} 