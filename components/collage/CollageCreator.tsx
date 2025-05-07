"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dictionary, Locale, getTranslation } from "@/lib/i18n";

// 导入子组件和常量
import { CollageImage, DEFAULT_LAYOUTS } from "./constants";
import CollageRating from "./CollageRating";
import CollageToolbar from "./CollageToolbar";
import LayoutSelector from "./LayoutSelector";
import ImagesList from "./ImagesList";
import CollagePreview from "./CollagePreview";

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
  const [showRating, setShowRating] = useState(false);
  const collageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 清理函数
  useEffect(() => {
    return () => {
      // 清理创建的对象URL，避免内存泄漏
      images.forEach(image => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, [images]);

  // 辅助函数获取翻译
  const t = (key: string): string => {
    return getTranslation(dict, key);
  };

  // 处理文件上传
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: CollageImage[] = [];
    let hasInvalidFiles = false;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        hasInvalidFiles = true;
        continue;
      }
      
      const url = URL.createObjectURL(file);
      
      newImages.push({
        id: `image-${Date.now()}-${i}`,
        file,
        url
      });
    }

    if (newImages.length > 0) {
      setImages(prevImages => [...prevImages, ...newImages]);
      
      // 使用宏任务延迟toast的执行
      if (hasInvalidFiles) {
        setTimeout(() => {
          toast.error(t("invalidImageFiles"));
        }, 0);
      }
      
      setTimeout(() => {
        toast.success(t("imagesUploaded").replace("{count}", newImages.length.toString()));
      }, 0);
    } else if (hasInvalidFiles) {
      setTimeout(() => {
        toast.error(t("allFilesInvalid"));
      }, 0);
    }
    
    // 清空文件输入，以便用户可以再次上传相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [t]);

  // 处理添加到预览区
  const handleAddToPreview = useCallback((image: CollageImage) => {
    if (!image) return;

    // 查找第一个空位置
    const totalCells = selectedLayout.cols * selectedLayout.rows;
    let position = -1; // 初始化为-1，表示未找到空位置
    
    // 检查每个位置，找到第一个没有图片的位置
    for (let i = 0; i < totalCells; i++) {
      const hasImage = images.some(img => img.position === i);
      if (!hasImage) {
        position = i;
        break;
      }
    }
    
    // 如果找到空位置，则将图片添加到该位置
    if (position === -1) {
      // 如果没有空位置，提示用户
      toast.warning(t("noEmptyPosition"));
      return;
    }
    
    setImages(prevImages => {
      const updatedImages = [...prevImages];
      const index = updatedImages.findIndex(img => img.id === image.id);
      
      if (index > -1) {
        // 如果图片已经在预览区中，更新其位置
        if (updatedImages[index].position !== undefined) {
          // 先检查它已经是否在同一个位置
          if (updatedImages[index].position === position) {
            return prevImages;
          }
        }
        
        updatedImages[index] = {...updatedImages[index], position};
        
        // 使用宏任务延迟toast的执行
        setTimeout(() => {
          toast.success(t("addedToPreview"));
        }, 0);
        
        return updatedImages;
      }
      return prevImages;
    });
  }, [images, selectedLayout.cols, selectedLayout.rows, t]);

  // 处理下载
  const handleDownload = useCallback(async () => {
    if (!collageRef.current) return;
    
    // 检查是否需要登录
    if (!isSignedIn) {
      setTimeout(() => {
        toast.error(t('loginRequired'));
      }, 0);
      router.push(`/${locale}/sign-in`);
      return;
    }
    
    try {
      setIsDownloading(true);
      setTimeout(() => {
        toast.info(t("generatingCollage"));
      }, 0);
      
      // 导入画布工具函数 - 动态导入减少初始加载时间
      const { generateCollageImage } = await import("./utils/canvasUtils");
      
      // 生成拼图图像
      const dataUrl = await generateCollageImage(collageRef.current, images, selectedLayout);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `collage-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      setTimeout(() => {
        toast.success(t("downloadSuccess"));
      }, 0);
      
      // 使用setTimeout来避免在渲染过程中setState
      setTimeout(() => {
        setShowRating(true);
      }, 100);
    } catch (error) {
      console.error("下载失败：", error);
      setTimeout(() => {
        toast.error(t("downloadFailed"));
      }, 0);
    } finally {
      setIsDownloading(false);
    }
  }, [collageRef, isSignedIn, locale, router, t, images, selectedLayout]);

  // 删除图片
  const handleRemoveImage = useCallback((id: string) => {
    setImages(prevImages => {
      // 找到要移除的图片
      const imageToRemove = prevImages.find(img => img.id === id);
      if (imageToRemove) {
        // 释放blob URL避免内存泄漏
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prevImages.filter(img => img.id !== id);
    });
    
    // 删除后显示提示
    setTimeout(() => {
      toast.success(t("imageRemoved"));
    }, 0);
  }, [t]);

  // 提交评分
  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!isSignedIn || !user) {
      setTimeout(() => toast.error(t('loginRequired')), 0);
      return;
    }

    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 在实际应用中，这里应该调用后端 API
      console.log("评分提交:", { 
        rating, 
        comment, 
        userId: user.id, 
        userEmail: user.primaryEmailAddress?.emailAddress 
      });
      
      setTimeout(() => {
        toast.success(t("ratingSubmitted"));
      }, 0);
      setShowRating(false);
    } catch (error) {
      setTimeout(() => {
        toast.error(t("ratingFailed"));
      }, 0);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-6 xl:px-8">
      {/* 工具栏：上传和下载按钮 */}
      <CollageToolbar
        onUploadClick={() => fileInputRef.current?.click()}
        onDownloadClick={handleDownload}
        isDownloading={isDownloading}
        hasImages={images.length > 0}
        translateFn={t}
      />
      
      {/* 文件上传输入 */}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        ref={fileInputRef}
      />
      
      {/* 整体左右结构：左侧布局选择+图片列表，右侧预览区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* 左侧：布局选择和上传图片列表 */}
        <div className="md:col-span-1">
          {/* 布局选择器 */}
          <LayoutSelector
            layouts={DEFAULT_LAYOUTS}
            selectedLayout={selectedLayout}
            onSelectLayout={setSelectedLayout}
            translateFn={t}
          />
          
          {/* 上传图片列表 */}
          <ImagesList
            images={images}
            onDragStart={setDraggedImage}
            onDragEnd={() => {
              setDraggedImage(null);
              setDraggedOver(null);
            }}
            onRemoveImage={handleRemoveImage}
            onAddToPreview={handleAddToPreview}
            translateFn={t}
          />
        </div>
        
        {/* 右侧: 拼图预览 */}
        <div className="md:col-span-1">
          <CollagePreview
            images={images}
            selectedLayout={selectedLayout}
            draggedOver={draggedOver}
            onDragOver={(e, position) => {
              e.preventDefault();
              setDraggedOver(position);
            }}
            onDrop={(position) => {
              if (!draggedImage) return;
              
              setImages(prevImages => {
                const updatedImages = [...prevImages];
                // 找到被拖拽的图片
                const draggedIndex = updatedImages.findIndex(img => img.id === draggedImage.id);
                
                if (draggedIndex === -1) return updatedImages;
                
                // 查找目标位置是否已有图片
                const targetImageIndex = updatedImages.findIndex(img => img.position === position);
                
                // 如果被拖拽图片已有位置，且目标位置也有图片，则交换它们的位置
                if (updatedImages[draggedIndex].position !== undefined && targetImageIndex !== -1) {
                  // 保存拖拽图片当前位置
                  const oldPosition = updatedImages[draggedIndex].position;
                  // 设置拖拽图片到新位置
                  updatedImages[draggedIndex] = {...updatedImages[draggedIndex], position};
                  // 目标位置的图片移到原来的位置
                  updatedImages[targetImageIndex] = {...updatedImages[targetImageIndex], position: oldPosition};
                } else {
                  // 直接设置拖拽图片的位置
                  updatedImages[draggedIndex] = {...updatedImages[draggedIndex], position};
                }
                
                return updatedImages;
              });
              
              setDraggedImage(null);
              setDraggedOver(null);
            }}
            onRemoveImage={handleRemoveImage}
            translateFn={t}
            collageRef={collageRef}
          />
        </div>
      </div>
      
      {/* 评分组件 - 使用折叠面板 */}
      {showRating && isSignedIn && (
        <div className="mt-3">
          <details className="bg-white rounded-lg border border-gray-200">
            <summary className="p-2 text-sm font-medium cursor-pointer">
              {t("rateCollageToolTitle")}
            </summary>
            <div className="p-3">
              <CollageRating
                onSubmitRating={handleSubmitRating}
                title=""
                ratingText={t("ratingText")}
                commentText={t("commentText")}
                submitText={t("submitRating")}
                thanksText={t("ratingThanks")}
              />
            </div>
          </details>
        </div>
      )}
      
      {/* 下载提示 */}
      {!isSignedIn && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center text-sm mt-2">
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