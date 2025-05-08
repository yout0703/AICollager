"use client";

import { AspectRatio } from "./constants";

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
  return (
    <div className="mb-4 bg-white p-4 border border-gray-200 rounded-lg">
      <h3 className="text-sm font-medium mb-3">{translateFn('chooseAspectRatio')}</h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {aspectRatios.map(aspectRatio => (
          <button
            key={aspectRatio.id}
            type="button"
            onClick={() => onSelectAspectRatio(aspectRatio)}
            className={`border rounded p-1 hover:border-blue-500 ${
              selectedAspectRatio.id === aspectRatio.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            title={aspectRatio.description}
          >
            <div 
              className="mx-auto bg-gray-100 flex items-center justify-center" 
              style={{
                width: "100%",
                paddingBottom: `${(1 / aspectRatio.ratio) * 100}%`,
                position: "relative"
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-gray-500">{aspectRatio.name}</span>
              </div>
            </div>
            <p className="text-xs mt-1 text-center text-gray-600">{aspectRatio.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
} 