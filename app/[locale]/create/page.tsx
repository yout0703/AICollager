'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ImageUploader, ImageFile } from '@/components/ui/ImageUploader';
import { PreferenceSelector, CollagePreferences } from '@/components/collage/PreferenceSelector';
import { CreditsBadge } from '@/components/ui/CreditsBadge';
import { CollageGenerationProgress } from '@/components/ui/ProgressBar';
import { AIProcessingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toastMessage } from '@/lib/toast';

interface GenerationState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  collageId?: string;
  errorMessage?: string;
}

export default function CreateCollagePage() {
  const { user } = useUser();
  const router = useRouter();
  
  // 状态管理
  const [images, setImages] = useState<ImageFile[]>([]);
  const [preferences, setPreferences] = useState<CollagePreferences>({
    style: 'modern',
    theme: 'family',
    colorScheme: 'auto',
    aspectRatio: '1:1'
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userCredits, setUserCredits] = useState<number>(100); // 模拟积分
  const [generation, setGeneration] = useState<GenerationState>({
    status: 'idle',
    progress: 0
  });

  // 处理图片上传
  const handleImagesChange = useCallback((newImages: ImageFile[]) => {
    setImages(newImages);
  }, []);

  // 处理偏好变更
  const handlePreferencesChange = useCallback((newPreferences: CollagePreferences) => {
    setPreferences(newPreferences);
  }, []);

  // 一键生成拼图
  const handleGenerateCollage = async () => {
    if (images.length === 0) {
      toastMessage('请先上传至少一张图片', 'error');
      return;
    }

    // 检查积分
    if (user && userCredits < 5) {
      toastMessage('积分不足，请邀请朋友获取积分', 'error');
      return;
    }

    setGeneration({ status: 'uploading', progress: 0 });

    try {
      // 准备表单数据
      const formData = new FormData();
      
      // 添加图片
      images.forEach((image) => {
        formData.append('images', image.file);
      });
      
      // 添加其他数据
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('preferences', JSON.stringify(preferences));

      // 模拟进度更新
      setGeneration({ status: 'processing', progress: 1 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGeneration({ status: 'processing', progress: 2 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGeneration({ status: 'processing', progress: 3 });

      // 调用API
      const response = await fetch('/api/collage/generate', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '生成失败');
      }

      // 生成成功
      setGeneration({ 
        status: 'completed', 
        progress: 4,
        collageId: result.collage.uuid
      });

      // 更新积分
      if (result.remainingCredits !== undefined) {
        setUserCredits(result.remainingCredits);
      }

      toastMessage('拼图生成成功！', 'success');

      // 3秒后跳转到拼图详情页
      setTimeout(() => {
        router.push(`/zh/collage/${result.collage.uuid}`);
      }, 3000);

    } catch (error) {
      console.error('生成拼图失败:', error);
      setGeneration({
        status: 'error',
        progress: 0,
        errorMessage: error instanceof Error ? error.message : '生成失败，请稍后重试'
      });
      toastMessage('生成失败，请稍后重试', 'error');
    }
  };

  // 重新开始
  const handleRestart = () => {
    setGeneration({ status: 'idle', progress: 0 });
    setImages([]);
    setTitle('');
    setDescription('');
  };

  // 打开邀请弹窗
  const handleOpenInviteModal = () => {
    // TODO: 实现邀请弹窗
    toastMessage('邀请功能正在开发中...', 'info');
  };

  if (generation.status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <AIProcessingSpinner text="AI 正在为您生成拼图..." />
            <div className="mt-8">
              <CollageGenerationProgress currentStep={generation.progress} />
            </div>
            <p className="text-center text-gray-600 mt-6">
              请稍等，正在分析 {images.length} 张图片并生成专属拼图...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (generation.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              拼图生成完成！
            </h2>
            
            <p className="text-gray-600 mb-6">
              您的专属AI拼图已经生成，正在为您跳转到详情页...
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/zh/collage/${generation.collageId}`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看拼图
              </Link>
              
              <button
                onClick={handleRestart}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                再做一个
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/zh"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回首页
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <CreditsBadge
                  credits={userCredits}
                  variant="compact"
                  onAddCredits={handleOpenInviteModal}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            创建AI拼图
          </h1>
          <p className="text-gray-600">
            上传您的照片，选择喜欢的风格，AI将为您生成精美的拼图作品
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：图片上传和基本信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 图片上传 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                上传图片
              </h2>
              <ImageUploader
                maxImages={10}
                onImagesChange={handleImagesChange}
                disabled={generation.status !== 'idle'}
              />
            </div>

            {/* 基本信息 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                拼图信息
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标题 (可选)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="为您的拼图起个名字..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={generation.status !== 'idle'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述 (可选)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="描述一下这个拼图的故事..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={generation.status !== 'idle'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：偏好设置和生成按钮 */}
          <div className="space-y-6">
            {/* 偏好设置 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                个性化设置
              </h2>
              <PreferenceSelector
                preferences={preferences}
                onChange={handlePreferencesChange}
              />
            </div>

            {/* 生成按钮 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                {/* 积分消耗提示 */}
                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          生成拼图将消耗 5 积分
                        </p>
                        <p className="text-xs text-blue-700">
                          当前余额: {userCredits} 积分
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 试用提示 */}
                {!user && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Sparkles className="w-5 h-5 text-orange-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          试用用户可免费生成 3 次
                        </p>
                        <p className="text-xs text-orange-700">
                          注册后可获得更多积分
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 生成按钮 */}
                <button
                  onClick={handleGenerateCollage}
                  disabled={images.length === 0 || generation.status !== 'idle'}
                  className={`
                    w-full flex items-center justify-center px-6 py-4 rounded-lg font-medium transition-colors
                    ${images.length === 0 || generation.status !== 'idle'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    }
                  `}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  一键生成AI拼图
                </button>

                {generation.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      {generation.errorMessage}
                    </p>
                    <button
                      onClick={() => setGeneration({ status: 'idle', progress: 0 })}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      重试
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 