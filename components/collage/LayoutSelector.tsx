"use client";

import { Layout } from "./constants";

interface LayoutSelectorProps {
  layouts: Layout[];
  selectedLayout: Layout;
  onSelectLayout: (layout: Layout) => void;
  translateFn: (key: string) => string;
}

export default function LayoutSelector({
  layouts,
  selectedLayout,
  onSelectLayout,
  translateFn
}: LayoutSelectorProps) {
  return (
    <div className="mb-3 bg-white p-3 border border-gray-200 rounded-lg">
      <h3 className="text-sm font-medium mb-3">{translateFn('chooseLayout')}</h3>
      <div className="flex flex-wrap gap-3">
        {layouts.map(layout => (
          <button
            key={layout.id}
            className={`p-1.5 border rounded-md ${
              selectedLayout.id === layout.id
                ? 'border-primary border-2 bg-pink-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectLayout(layout)}
            title={layout.name || layout.id}
          >
            <div className={`w-10 h-12 grid ${layout.template} gap-0.5`}>
              {Array.from({ length: layout.cols * layout.rows }).map((_, i) => (
                <div key={i} className="bg-gray-100 w-full h-full"></div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 