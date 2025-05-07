"use client";

interface CollageToolbarProps {
  onUploadClick: () => void;
  onDownloadClick: () => void;
  isDownloading: boolean;
  hasImages: boolean;
  translateFn: (key: string) => string;
}

export default function CollageToolbar({
  onUploadClick,
  onDownloadClick,
  isDownloading,
  hasImages,
  translateFn
}: CollageToolbarProps) {
  return (
    <div className="my-3 flex flex-row justify-between gap-3">
      <button
        className="bg-primary text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 text-sm"
        onClick={onUploadClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        {translateFn('uploadButton')}
      </button>
      
      <button 
        className={`px-4 py-1.5 rounded-lg font-medium flex items-center gap-1 text-sm ${
          isDownloading || !hasImages
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
        onClick={onDownloadClick}
        disabled={isDownloading || !hasImages}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {translateFn('downloadButton')}
      </button>
    </div>
  );
} 