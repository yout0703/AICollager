"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useUser, SignIn, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Dictionary, Locale, getTranslation } from "@/lib/i18n";
import { toastMessage } from "@/lib/toast";
import { Upload, Download, RotateCcw, Star, Share2, Trash2, Plus, X } from 'lucide-react';

// 导入子组件和常量
import { CollageImage, DEFAULT_LAYOUTS, ImageTransform, DEFAULT_IMAGE_TRANSFORM, DEFAULT_ASPECT_RATIOS, AspectRatio } from "./constants";
import CollageRating from "./CollageRating";
import CollageToolbar from "./CollageToolbar";
import LayoutSelector from "./LayoutSelector";
import AspectRatioSelector from "./AspectRatioSelector";
import ImagesList from "./ImagesList";
import CollagePreview from "./CollagePreview";
import ImageEditToolbar from "./ImageEditToolbar";

interface CollageCreatorProps {
  dict: Dictionary;
  locale: Locale;
}

export default function CollageCreator({ dict, locale }: CollageCreatorProps) {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [selectedLayout, setSelectedLayout] = useState(DEFAULT_LAYOUTS[0]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(DEFAULT_ASPECT_RATIOS[0]);
  const [images, setImages] = useState<CollageImage[]>([]);
  const [draggedImage, setDraggedImage] = useState<CollageImage | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 清理函数
  useEffect(() => {
    return () => {
      // DataURL 不需要手动释放，移除清理代码
      // images.forEach(image => {
      //   URL.revokeObjectURL(image.url);
      // });
    };
  }, []);

  // 辅助函数获取翻译
  const t = useCallback((key: string): string => {
    return getTranslation(dict, key);
  }, [dict]);

  // 处理文件上传
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newImages: CollageImage[] = Array.from(files).map(file => {
      const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      return {
        id,
        file,
        url: URL.createObjectURL(file),
        transform: { ...DEFAULT_IMAGE_TRANSFORM } // 初始化图像变换属性
      };
    });
    
    setImages(prev => [...prev, ...newImages]);
    
    // 如果有空白的预览格，自动填充上传的图片
    const totalCells = selectedLayout.cols * selectedLayout.rows;
    const filledPositions = images.map(img => img.position).filter(pos => pos !== undefined);
    
    // 找出空白格子
    const emptyPositions: number[] = [];
    for (let i = 0; i < totalCells; i++) {
      if (!filledPositions.includes(i)) {
        emptyPositions.push(i);
      }
    }
    
    // 自动填充
    if (emptyPositions.length > 0) {
      setImages(prev => {
        const updatedImages = [...prev];
        const availableEmptyPositions = [...emptyPositions];
        
        // 只处理新上传的图片
        newImages.forEach((newImg, index) => {
          if (availableEmptyPositions.length > 0 && index < availableEmptyPositions.length) {
            const positionIndex = updatedImages.findIndex(img => img.id === newImg.id);
            if (positionIndex !== -1) {
              updatedImages[positionIndex] = {
                ...updatedImages[positionIndex],
                position: availableEmptyPositions[index]
              };
            }
          }
        });
        
        return updatedImages;
      });
    }
    
    toastMessage(t("imagesUploaded"), 'success');
  }, [images, selectedLayout, t]);

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
      toastMessage(t("noEmptyPosition"), 'warning');
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

        // 添加到预览区成功不显示 toast 消息
        // toast.success(t("addedToPreview"));

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
      toastMessage(t('loginRequired'), 'info');
      
      // 保存当前拼图状态到 localStorage，以防用户选择页面登录而不是弹窗登录
      try {
        const collageState = {
          selectedLayout,
          selectedAspectRatio,
          images: images.map(img => ({
            id: img.id,
            url: img.url,
            position: img.position
          }))
        };
        localStorage.setItem('collageState', JSON.stringify(collageState));
        
        // 显示登录弹窗
        setShowLoginModal(true);
      } catch (error) {
        console.error('保存拼图状态失败:', error);
        // 发生错误时仍然显示登录弹窗
        setShowLoginModal(true);
      }
      return;
    }

    try {
      setIsDownloading(true);
      // 生成拼图时不显示 toast 消息
      // toast.info(t("generatingCollage"));

      // 导入画布工具函数 - 动态导入减少初始加载时间
      const { generateCollageImage } = await import("./utils/canvasUtils");

      // 生成拼图图像
      const dataUrl = await generateCollageImage(collageRef.current, images, selectedLayout, selectedAspectRatio);

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `collage-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toastMessage(t("downloadSuccess"), 'success');

      // 使用requestAnimationFrame确保状态更新发生在渲染之后
      requestAnimationFrame(() => {
        setShowRating(true);
      });
    } catch (error) {
      console.error("下载失败：", error);
      toastMessage(t("downloadFailed"), 'error');
    } finally {
      setIsDownloading(false);
    }
  }, [collageRef, isSignedIn, t, images, selectedLayout, selectedAspectRatio]);

  // 从 localStorage 恢复拼图状态
  useEffect(() => {
    // 从 URL 查询参数检查是否需要恢复状态
    const shouldRestore = window.location.search.includes('return=true');
    
    if (isSignedIn && shouldRestore) {
      try {
        const savedState = localStorage.getItem('collageState');
        if (savedState) {
          const { selectedLayout: savedLayout, selectedAspectRatio: savedAspectRatio, images: savedImages } = JSON.parse(savedState);
          
          // 恢复布局
          if (savedLayout) {
            setSelectedLayout(savedLayout);
          }
          
          // 恢复尺寸比例
          if (savedAspectRatio) {
            setSelectedAspectRatio(savedAspectRatio);
          }
          
          // 恢复图片
          if (savedImages && savedImages.length > 0) {
            const processedImages = savedImages.map((img: { id: string, url: string, position?: number }) => ({
              id: img.id,
              url: img.url,
              position: img.position,
              file: null // 注意: file 对象无法序列化，这里使用 null 代替
            }));
            
            setImages(processedImages);
            toastMessage(t('collageRestored'), 'success');
          }
          
          // 清除保存的状态
          localStorage.removeItem('collageState');
          
          // 清除 URL 参数
          window.history.replaceState({}, document.title, `/${locale}/collage`);
        }
      } catch (error) {
        console.error('恢复拼图状态失败:', error);
      }
    }
  }, [isSignedIn, locale, t]);

  // 处理下载提示区域的登录按钮点击
  const handleLoginClick = useCallback(() => {
    // 保存当前拼图状态到 localStorage
    try {
      const collageState = {
        selectedLayout,
        selectedAspectRatio,
        images: images.map(img => ({
          id: img.id,
          url: img.url,
          position: img.position
        }))
      };
      localStorage.setItem('collageState', JSON.stringify(collageState));
      
      // 显示登录弹窗
      setShowLoginModal(true);
    } catch (error) {
      console.error('保存拼图状态失败:', error);
      // 发生错误时仍然显示登录弹窗
      setShowLoginModal(true);
    }
  }, [images, selectedLayout, selectedAspectRatio]);

  // 删除图片
  const handleRemoveImage = useCallback((id: string) => {
    // 如果删除的是当前选中的图片，清除选中状态
    if (id === selectedImageId) {
      setSelectedImageId(null);
    }
    
    setImages(prevImages => {
      // 找到要移除的图片
      const imageToRemove = prevImages.find(img => img.id === id);
      if (imageToRemove) {
        if (imageToRemove.position !== undefined) {
          // 如果有position属性，只移除position属性（从预览区移除），但保留图片在上传列表
          return prevImages.map(img =>
            img.id === id ? { ...img, position: undefined } : img
          );
        } else {
          // 如果没有position（在上传列表中删除），则完全移除图片
          // 注意：如果使用的是 DataURL 而不是 Blob URL，则不需要调用 revokeObjectURL
          // URL.revokeObjectURL(imageToRemove.url);
          return prevImages.filter(img => img.id !== id);
        }
      }
      return prevImages;
    });

    // 删除成功不显示 toast 消息
    // toast.success(t("imageRemoved"));
  }, [selectedImageId, t]);

  // 处理预览区域的图片删除
  const handleRemoveFromPreview = useCallback((id: string) => {
    // 如果删除的是当前选中的图片，清除选中状态
    if (id === selectedImageId) {
      setSelectedImageId(null);
    }
    
    setImages(prevImages => {
      return prevImages.map(img =>
        img.id === id ? { ...img, position: undefined } : img
      );
    });

    // 从预览区移除成功不显示 toast 消息
    // toast.success(t("imageRemovedFromPreview"));
  }, [selectedImageId, t]);

  // 提交评分
  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!isSignedIn || !user) {
      toastMessage(t('loginRequired'), 'error');
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

      // 评分提交成功保留提示，这是重要的用户反馈
      toastMessage(t("ratingSubmitted"), 'success');
      setShowRating(false);
    } catch (error) {
      toastMessage(t("ratingFailed"), 'error');
    }
  };

  // 监听登录状态变化，当用户登录成功后自动关闭弹窗
  useEffect(() => {
    if (isSignedIn && showLoginModal) {
      // 用户登录成功，关闭登录弹窗
      setShowLoginModal(false);
      
      // 恢复保存的拼图状态
      try {
        const savedState = localStorage.getItem('collageState');
        if (savedState) {
          const { selectedLayout: savedLayout, selectedAspectRatio: savedAspectRatio, images: savedImages } = JSON.parse(savedState);
          
          // 恢复布局
          if (savedLayout) {
            setSelectedLayout(savedLayout);
          }
          
          // 恢复尺寸比例
          if (savedAspectRatio) {
            setSelectedAspectRatio(savedAspectRatio);
          }
          
          // 恢复图片
          if (savedImages && savedImages.length > 0) {
            const processedImages = savedImages.map((img: { id: string, url: string, position?: number }) => ({
              id: img.id,
              url: img.url,
              position: img.position,
              file: null // 注意: file 对象无法序列化，这里使用 null 代替
            }));
            
            setImages(processedImages);
            toastMessage(t('collageRestored'), 'success');
          }
          
          // 清除保存的状态
          localStorage.removeItem('collageState');
        }
      } catch (error) {
        console.error('恢复拼图状态失败:', error);
      }
    }
  }, [isSignedIn, showLoginModal, t]);

  // 处理图像变换更新
  const handleUpdateImageTransform = useCallback((id: string, transform: ImageTransform) => {
    setImages(prevImages => {
      return prevImages.map(img => 
        img.id === id 
          ? { ...img, transform } 
          : img
      );
    });
  }, []);

  // 处理图片点击选择
  const handleImageSelect = useCallback((id: string) => {
    setSelectedImageId(prev => prev === id ? null : id);
  }, []);

  // 获取选中的图片
  const selectedImage = images.find(img => img.id === selectedImageId);

  return (
    <div className="w-full px-0">
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

      {/* 整体布局结构 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* 左侧：尺寸选择、布局选择和上传图片列表 */}
        <div className="md:col-span-1">
          {/* 尺寸比例选择器 */}
          <AspectRatioSelector
            aspectRatios={DEFAULT_ASPECT_RATIOS}
            selectedAspectRatio={selectedAspectRatio}
            onSelectAspectRatio={setSelectedAspectRatio}
            translateFn={t}
          />
        
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

        {/* 中间: 拼图预览 */}
        <div className={selectedImage ? 'md:col-span-1' : 'md:col-span-2'}>
          <CollagePreview
            images={images}
            selectedLayout={selectedLayout}
            selectedAspectRatio={selectedAspectRatio}
            draggedOver={draggedOver}
            onDragOver={(e, position) => {
              e.preventDefault();
              setDraggedOver(position);
            }}
            onDrop={(position) => {
              if (!draggedImage) return;

              const draggedId = draggedImage.id;

              setImages(prevImages => {
                // 复制原始图片数组
                const updatedImages = [...prevImages];

                // 找到被拖拽的图片索引
                const draggedIndex = updatedImages.findIndex(img => img.id === draggedId);

                // 如果找不到被拖拽的图片，直接返回原数组
                if (draggedIndex === -1) return prevImages;

                // 查找目标位置是否已有图片
                const targetImageIndex = updatedImages.findIndex(img => img.position === position);

                // 创建结果数组
                const result = [...updatedImages];

                if (targetImageIndex !== -1) {
                  // 目标位置已有图片
                  if (result[draggedIndex].position !== undefined) {
                    // 如果拖拽的图片已在某个位置，交换两张图片的位置
                    const oldPosition = result[draggedIndex].position;
                    result[draggedIndex] = {...result[draggedIndex], position};
                    result[targetImageIndex] = {...result[targetImageIndex], position: oldPosition};
                  } else {
                    // 拖拽的图片不在预览区，将其放入预览区并移动目标图片
                    // 从上传列表拖入目标位置已有图片的情况
                    result[draggedIndex] = {...result[draggedIndex], position};
                    // 尝试找一个空位置
                    const totalCells = selectedLayout.cols * selectedLayout.rows;
                    let emptyPosition = -1;

                    for (let i = 0; i < totalCells; i++) {
                      if (i !== position && !result.some(img => img.position === i)) {
                        emptyPosition = i;
                        break;
                      }
                    }

                    if (emptyPosition !== -1) {
                      // 如果找到空位置，移动被替换的图片到空位置
                      result[targetImageIndex] = {...result[targetImageIndex], position: emptyPosition};
                    } else {
                      // 没有空位置，移除被替换图片的位置属性（回到上传列表）
                      result[targetImageIndex] = {...result[targetImageIndex], position: undefined};
                    }
                  }
                } else {
                  // 目标位置没有图片，直接放置
                  result[draggedIndex] = {...result[draggedIndex], position};
                }

                return result;
              });

              // 重置状态变量
              setDraggedImage(null);
              setDraggedOver(null);
            }}
            onRemoveImage={handleRemoveFromPreview}
            onUpdateImageTransform={handleUpdateImageTransform}
            onImageClick={handleImageSelect}
            translateFn={t}
            collageRef={collageRef}
          />
        </div>

        {/* 右侧: 图片编辑工具栏 */}
        {selectedImage && (
          <div className="md:col-span-1">
            <ImageEditToolbar
              image={selectedImage}
              onChange={(transform) => handleUpdateImageTransform(selectedImageId!, transform)}
              onClose={() => setSelectedImageId(null)}
              translateFn={t}
            />
          </div>
        )}
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
              onClick={handleLoginClick}
            >
              {t('nav.login')}
            </button>
          </p>
        </div>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md relative">
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowLoginModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="py-4">
              <SignInButton 
                mode="modal"
                fallbackRedirectUrl={`/${locale}/collage`}
              >
              </SignInButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}