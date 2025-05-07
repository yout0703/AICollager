"use client";

import { RefObject } from "react";
import { CollageImage, Layout, getCollageGridClass, getCollageGridStyle } from "./constants";

interface CollagePreviewProps {
  images: CollageImage[];
  selectedLayout: Layout;
  draggedOver: number | null;
  onDragOver: (e: React.DragEvent, position: number) => void;
  onDrop: (position: number) => void;
  onRemoveImage: (id: string) => void;
  translateFn: (key: string) => string;
  collageRef: RefObject<HTMLDivElement>;
}

export default function CollagePreview({
  images,
  selectedLayout,
  draggedOver,
  onDragOver,
  onDrop,
  onRemoveImage,
  translateFn,
  collageRef
}: CollagePreviewProps) {
  return (
    <div className="h-full p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-sm font-medium mb-3">{translateFn('adjustPosition')}</h3>
      
      <div className="relative mx-auto" style={{ paddingBottom: "90%", maxWidth: "90%" }}>
        <div 
          ref={collageRef}
          className={`${getCollageGridClass(selectedLayout)} absolute inset-0 shadow-md`}
          style={{ 
            width: '100%',
            height: '100%',
            gap: '2px',
            ...getCollageGridStyle(selectedLayout)
          }}
        >
          {Array.from({ length: selectedLayout.cols * selectedLayout.rows }).map((_, i) => {
            const image = images.find(img => img.position === i);
            const cellClass = selectedLayout.custom && selectedLayout.id === "layout-6" 
              ? `cell-${i}`
              : '';
              
            return (
              <div
                key={`cell-${i}`}
                className={`w-full h-full border flex items-center justify-center overflow-hidden ${cellClass} ${
                  draggedOver === i 
                    ? 'bg-blue-100 border-blue-300 border-2' 
                    : image 
                      ? 'border-gray-300' 
                      : 'border-gray-200 bg-gray-50'
                }`}
                style={
                  selectedLayout.custom && selectedLayout.id === "layout-6" 
                    ? { gridArea: i === 0 ? 'a' : i === 1 ? 'b' : 'c' } 
                    : {}
                }
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                data-position={i}
              >
                {image ? (
                  <div className="relative w-full h-full">
                    <img
                      src={image.url}
                      alt={translateFn("collageImage")}
                      className="w-full h-full object-cover"
                      draggable={false}
                      crossOrigin="anonymous"
                    />
                    <button
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveImage(image.id);
                      }}
                      title={translateFn("removeImage")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-400">{translateFn('dragImages')}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <p className="mt-3 text-center text-xs text-gray-500">
        {translateFn('previewInstructions')}
      </p>
      
      <div className="mt-2 text-center text-xs text-gray-400">
        <span className="inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {translateFn('aspectRatioInfo')}
        </span>
      </div>
    </div>
  );
} 