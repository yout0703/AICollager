'use client';

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Camera } from 'lucide-react';

export interface ImageFile {
  file: File;
  id: string;
  preview: string;
}

interface ImageUploaderProps {
  maxImages?: number;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  onImagesChange: (images: ImageFile[]) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  maxImages = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeInMB = 10,
  onImagesChange,
  disabled = false,
  className = ''
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `不支持的文件格式。请上传 ${acceptedTypes.join(', ')} 格式的图片`;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `文件大小不能超过 ${maxSizeInMB}MB`;
    }

    return null;
  }, [acceptedTypes, maxSizeInMB]);

  const addImages = useCallback((files: FileList) => {
    const newImages: ImageFile[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      if (images.length + newImages.length >= maxImages) {
        alert(`最多只能上传 ${maxImages} 张图片`);
        return;
      }

      const id = Math.random().toString(36).substring(2);
      const preview = URL.createObjectURL(file);

      newImages.push({ file, id, preview });
    });

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
  }, [images, maxImages, onImagesChange, validateFile]);

  const removeImage = useCallback((id: string) => {
    const updatedImages = images.filter((img) => {
      if (img.id === id) {
        URL.revokeObjectURL(img.preview);
        return false;
      }
      return true;
    });

    setImages(updatedImages);
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      addImages(files);
    }
  }, [addImages, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      addImages(files);
    }
    // 重置input值，允许重复选择同一文件
    e.target.value = '';
  }, [addImages]);

  const openFileSelector = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={`w-full ${className}`}>
      {/* 拖拽上传区域 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive
            ? 'border-primary bg-primary/10'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {dragActive ? (
              <Upload className="w-8 h-8 text-primary" />
            ) : (
              <Camera className="w-8 h-8 text-gray-500" />
            )}
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {dragActive ? '释放文件' : '上传图片'}
          </h3>

          <p className="text-sm text-gray-500 mb-2">
            拖拽图片到这里，或点击选择文件
          </p>

          <p className="text-xs text-gray-400">
            支持 JPEG、PNG、WebP 格式，最大 {maxSizeInMB}MB，最多 {maxImages} 张
          </p>
        </div>
      </div>

      {/* 图片预览网格 */}
      {images.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              已上传图片 ({images.length}/{maxImages})
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={image.preview}
                    alt={image.file.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* 文件名 */}
                <p className="mt-2 text-xs text-gray-600 truncate">
                  {image.file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
