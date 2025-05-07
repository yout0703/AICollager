"use client";

import { DEFAULT_LAYOUTS, Layout } from "./constants";

interface CollageLayoutProps {
  selectedLayout: Layout;
  onSelectLayout: (layout: Layout) => void;
  title: string;
}

export default function CollageLayout({
  selectedLayout,
  onSelectLayout,
  title
}: CollageLayoutProps) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {DEFAULT_LAYOUTS.map(layout => (
          <button
            key={layout.id}
            className={`p-2 border rounded-md ${
              selectedLayout.id === layout.id
                ? 'border-primary border-2 bg-pink-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectLayout(layout)}
          >
            <div className="relative w-full" style={{ paddingBottom: "80%" }}>
              <div className={`absolute inset-0 grid ${layout.template} gap-1`}>
                {Array.from({ length: layout.cols * layout.rows }).map((_, i) => (
                  <div key={i} className="bg-gray-100 w-full h-full"></div>
                ))}
              </div>
            </div>
            <p className="font-medium text-xs text-center mt-1">{layout.name}</p>
            <p className="text-xs text-gray-500 text-center hidden sm:block">{layout.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
} 