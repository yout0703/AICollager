"use client";

import { useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dictionary, Locale, getTranslation } from "@/lib/i18n";
import Image from "next/image";
import { toPng } from "html-to-image";

// 默认布局配置
const DEFAULT_LAYOUTS = [
  {
    id: "layout-1",
    name: "2 x 1",
    description: "简单双分割",
    cols: 2,
    rows: 1,
    template: "grid-cols-2 grid-rows-1",
  },
  {
    id: "layout-2",
    name: "2 x 2",
    description: "四格棋盘",
    cols: 2,
    rows: 2,
    template: "grid-cols-2 grid-rows-2",
  },
  {
    id: "layout-3",
    name: "3 x 1",
    description: "三列式",
    cols: 3,
    rows: 1,
    template: "grid-cols-3 grid-rows-1",
  },
  {
    id: "layout-4",
    name: "1 x 2",
    description: "双行",
    cols: 1,
    rows: 2,
    template: "grid-cols-1 grid-rows-2",
  },
  {
    id: "layout-5",
    name: "3 x 2",
    description: "六格",
    cols: 3,
    rows: 2,
    template: "grid-cols-3 grid-rows-2",
  },
  {
    id: "layout-6",
    name: "特殊布局1",
    description: "主副搭配",
    cols: 2,
    rows: 2,
    template: "grid-special-1",
    custom: true,
  },
];

// 图片类型
interface CollageImage {
  id: string;
  file: File;
  url: string;
  position?: number; // 在布局中的位置
}

interface CollageCreatorProps {
  dict: Dictionary;
  locale: Locale;
}

export default function CollageCreator({ dict, locale }: CollageCreatorProps) {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [selectedLayout, setSelectedLayout] = useState(DEFAULT_LAYOUTS[0]);
  const [images, setImages] = useState<CollageImage[]>([]);
  const [draggedImage, setDraggedImage] = useState<CollageImage | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const collageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 辅助函数获取翻译
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: CollageImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} 不是有效的图片文件`);
        continue;
      }
      
      const url = URL.createObjectURL(file);
      newImages.push({
        id: `image-${Date.now()}-${i}`,
        file,
        url,
      });
    }

    setImages([...images, ...newImages]);
    
    // 清空文件输入，以便用户可以再次上传相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 处理拖拽开始
  const handleDragStart = (image: CollageImage) => {
    setDraggedImage(image);
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedImage(null);
    setDraggedOver(null);
  };

  // 处理拖拽进入
  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDraggedOver(position);
  };

  // 处理放置
  const handleDrop = (position: number) => {
    if (!draggedImage) return;

    const updatedImages = [...images];
    const index = updatedImages.findIndex(img => img.id === draggedImage.id);
    
    if (index > -1) {
      // 移除现有位置的图片
      const existingImageAtPosition = updatedImages.find(img => img.position === position);
      if (existingImageAtPosition) {
        existingImageAtPosition.position = updatedImages[index].position;
      }
      
      // 设置新位置
      updatedImages[index].position = position;
      setImages(updatedImages);
    }
    
    setDraggedImage(null);
    setDraggedOver(null);
  };

  // 处理下载
  const handleDownload = useCallback(async () => {
    if (!collageRef.current) return;
    
    // 检查是否需要登录
    if (!isSignedIn) {
      toast.error(t('loginRequired'));
      router.push(`/${locale}/sign-in`);
      return;
    }
    
    try {
      setIsDownloading(true);
      toast.info("正在生成拼图...");
      
      const dataUrl = await toPng(collageRef.current, { 
        quality: 0.95,
        pixelRatio: 2 
      });
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `collage-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("下载成功！");
    } catch (error) {
      console.error("下载失败：", error);
      toast.error("下载失败，请重试");
    } finally {
      setIsDownloading(false);
    }
  }, [collageRef, isSignedIn, locale, router, t]);

  // 删除图片
  const handleRemoveImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
  };

  // 渲染布局单元格
  const renderCells = () => {
    const cells = [];
    const totalCells = selectedLayout.cols * selectedLayout.rows;
    
    for (let i = 0; i < totalCells; i++) {
      const image = images.find(img => img.position === i);
      
      cells.push(
        <div 
          key={`cell-${i}`}
          className={`relative border border-gray-200 bg-gray-50 aspect-square ${
            draggedOver === i ? 'bg-blue-100 border-blue-300' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
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
                onClick={() => handleRemoveImage(image.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <p>{t('dragImages')}</p>
            </div>
          )}
        </div>
      );
    }
    
    return cells;
  };

  // 获取拼图布局样式 
  const getCollageGridStyle = () => {
    if (selectedLayout.custom) {
      if (selectedLayout.id === "layout-6") {
        return "grid-template-areas: 'a a b' 'a a c'";
      }
      return "";
    }
    return "";
  };

  // 获取拼图布局类
  const getCollageGridClass = () => {
    if (selectedLayout.custom) {
      if (selectedLayout.id === "layout-6") {
        return "grid grid-cols-3 grid-rows-2";
      }
      return "grid";
    }
    return `grid ${selectedLayout.template}`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 上传部分 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <button
              className="bg-primary text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {t('uploadButton')}
            </button>
          </div>
          
          <button 
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
              isDownloading || images.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            onClick={handleDownload}
            disabled={isDownloading || images.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {t('downloadButton')}
          </button>
        </div>
        
        {/* 上传的图片预览 */}
        {images.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">上传的图片：</p>
            <div className="flex flex-wrap gap-4">
              {images.map(image => (
                <div 
                  key={image.id}
                  className="relative w-20 h-20 border rounded-md overflow-hidden"
                  draggable
                  onDragStart={() => handleDragStart(image)}
                  onDragEnd={handleDragEnd}
                >
                  <Image
                    src={image.url}
                    alt="Uploaded image"
                    fill
                    className="object-cover"
                  />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1"
                    onClick={() => handleRemoveImage(image.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 布局选择 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">{t('chooseLayout')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {DEFAULT_LAYOUTS.map(layout => (
            <button
              key={layout.id}
              className={`p-3 border rounded-lg ${
                selectedLayout.id === layout.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedLayout(layout)}
            >
              <div className={`aspect-square w-full grid ${layout.template} gap-1 mb-2`}>
                {Array.from({ length: layout.cols * layout.rows }).map((_, i) => (
                  <div key={i} className="bg-gray-200 w-full h-full"></div>
                ))}
              </div>
              <p className="font-medium text-sm">{layout.name}</p>
              <p className="text-xs text-gray-500">{layout.description}</p>
            </button>
          ))}
        </div>
      </div>
      
      {/* 拼图预览 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">{t('adjustPosition')}</h2>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div 
            ref={collageRef}
            className={getCollageGridClass()}
            style={{ 
              width: '100%',
              maxWidth: '700px',
              margin: '0 auto',
              gap: '4px',
              ...(getCollageGridStyle() ? { style: getCollageGridStyle() } : {})
            }}
          >
            {renderCells()}
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>将图片拖拽到上方的布局中来创建拼图</p>
          </div>
        </div>
      </div>
      
      {/* 下载提示 */}
      {!isSignedIn && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-800">
            {t('loginRequired')} 
            <button
              className="ml-2 text-primary underline"
              onClick={() => router.push(`/${locale}/sign-in`)}
            >
              {t('nav.login')}
            </button>
          </p>
        </div>
      )}
    </div>
  );
} 