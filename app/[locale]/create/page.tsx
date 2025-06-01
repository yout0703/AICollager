'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ImageUploader, ImageFile } from '@/components/ui/ImageUploader';
import { PreferenceSelector, CollagePreferences } from '@/components/collage/PreferenceSelector';
import { CreditsBadge } from '@/components/ui/CreditsBadge';
import { CollageGenerationProgress } from '@/components/ui/ProgressBar';
import { AIProcessingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Sparkles, Upload, Settings, Wand2, Info, CheckCircle, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { toastMessage } from '@/lib/toast';

interface GenerationState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  collageId?: string;
  errorMessage?: string;
}

// 生成进度弹窗组件
function GenerationModal({ 
  generation, 
  images, 
  onClose, 
  onRestart, 
  onViewCollage 
}: {
  generation: GenerationState;
  images: ImageFile[];
  onClose: () => void;
  onRestart: () => void;
  onViewCollage: (collageId: string) => void;
}) {
  console.log('🎭 GenerationModal 渲染，当前状态:', generation.status, '进度:', generation.progress);
  
  if (generation.status === 'idle') {
    console.log('🎭 GenerationModal 隐藏 (状态: idle)');
    return null;
  }

  console.log('🎭 GenerationModal 显示弹窗，状态:', generation.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 关闭按钮 */}
        {(generation.status === 'error' || generation.status === 'completed') && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <div className="p-8">
          {/* 上传状态 */}
          {generation.status === 'uploading' && (
            <>
              <AIProcessingSpinner text="正在上传图片..." />
              <p className="text-center text-gray-600 mt-6">
                正在处理 {images.length} 张图片，请稍候...
              </p>
            </>
          )}

          {/* 处理中状态 */}
          {generation.status === 'processing' && (
            <>
              <AIProcessingSpinner text="AI 正在为您生成拼图..." />
              <div className="mt-8">
                <CollageGenerationProgress currentStep={generation.progress} />
              </div>
              <p className="text-center text-gray-600 mt-6">
                请稍等，正在分析 {images.length} 张图片并生成专属拼图...
              </p>
            </>
          )}

          {/* 完成状态 */}
          {generation.status === 'completed' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                拼图生成完成！
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                您的专属AI拼图已经生成完成
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => generation.collageId && onViewCollage(generation.collageId)}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  查看拼图
                </button>
                
                <button
                  onClick={onRestart}
                  className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  再做一个
                </button>
              </div>
            </div>
          )}

          {/* 错误状态 */}
          {generation.status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                生成失败
              </h2>
              
              <p className="text-lg text-gray-600 mb-2">
                很抱歉，拼图生成过程中出现了问题
              </p>
              
              <p className="text-red-600 mb-8">
                {generation.errorMessage}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    console.log('🔄 用户点击重新尝试');
                    onClose();
                    // 重置生成状态
                    setTimeout(() => {
                      onRestart();
                    }, 100);
                  }}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  重新尝试
                </button>
                
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
    console.log('🚀 开始生成拼图，当前图片数量:', images.length);
    
    if (images.length === 0) {
      toastMessage('请先上传至少一张图片', 'error');
      return;
    }

    // 检查积分
    if (user && userCredits < 5) {
      toastMessage('积分不足，请邀请朋友获取积分', 'error');
      return;
    }

    console.log('✅ 开始上传和处理...');
    setGeneration({ status: 'uploading', progress: 0 });

    try {
      // 准备表单数据
      const formData = new FormData();
      
      // 添加图片
      images.forEach((image, index) => {
        console.log(`📁 添加图片 ${index + 1}: ${image.file.name}`);
        formData.append('images', image.file);
      });
      
      // 添加其他数据
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('preferences', JSON.stringify(preferences));

      console.log('📤 模拟进度更新...');
      // 模拟进度更新
      setGeneration({ status: 'processing', progress: 1 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGeneration({ status: 'processing', progress: 2 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGeneration({ status: 'processing', progress: 3 });
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🌐 调用生成API...');
      // 调用API - 使用完整的URL路径，确保不被中间件重定向
      const response = await fetch('/api/collage/generate', {
        method: 'POST',
        body: formData,
        // 添加头部信息，帮助调试
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      console.log('📡 API响应状态:', response.status, response.statusText);

      // 改善错误处理
      if (!response.ok) {
        console.error('❌ API响应失败:', response.status);
        // 尝试解析JSON错误信息
        let errorMessage = '生成失败';
        try {
          const errorData = await response.json();
          console.error('❌ 错误详情:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('❌ 解析错误响应失败:', parseError);
          // 如果返回的不是JSON，可能是HTML错误页面
          const errorText = await response.text();
          console.error('❌ 错误响应内容:', errorText.substring(0, 200));
          errorMessage = `服务器错误 (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      console.log('📋 解析API响应...');
      const result = await response.json();
      console.log('✅ API响应数据:', result);

      // 检查API返回的成功状态
      if (!result.success) {
        console.error('❌ API返回失败状态:', result.error);
        throw new Error(result.error || '生成失败');
      }

      console.log('🎉 生成成功！拼图ID:', result.collage.uuid);
      
      // 生成成功
      setGeneration({ 
        status: 'completed', 
        progress: 4,
        collageId: result.collage.uuid
      });

      // 更新积分
      if (result.remainingCredits !== undefined) {
        console.log('💰 更新积分:', result.remainingCredits);
        setUserCredits(result.remainingCredits);
      }

      toastMessage('拼图生成成功！', 'success');

    } catch (error) {
      console.error('💥 生成拼图失败:', error);
      console.error('错误类型:', typeof error);
      console.error('错误详情:', error);
      
      const errorMessage = error instanceof Error ? error.message : '生成失败，请稍后重试';
      console.error('🔥 设置错误状态:', errorMessage);
      
      setGeneration({
        status: 'error',
        progress: 0,
        errorMessage: errorMessage
      });
      
      toastMessage(errorMessage, 'error');
    }
  };

  // 重新开始
  const handleRestart = () => {
    console.log('🔄 重新开始，重置所有状态');
    setGeneration({ status: 'idle', progress: 0 });
    // 不清除图片，让用户可以重新生成
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    console.log('❌ 关闭弹窗，当前状态:', generation.status);
    if (generation.status === 'completed' || generation.status === 'error') {
      setGeneration({ status: 'idle', progress: 0 });
    }
  };

  // 查看拼图 - 自动跳转到编辑器页面
  const handleViewCollage = (collageId: string) => {
    console.log('👀 自动跳转到编辑器:', collageId);
    router.push(`/zh/editor/${collageId}`);
  };

  // 打开邀请弹窗
  const handleOpenInviteModal = () => {
    // TODO: 实现邀请弹窗
    toastMessage('邀请功能正在开发中...', 'info');
  };

  // 检查是否可以生成
  const canGenerate = images.length > 0 && generation.status === 'idle';
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* 生成进度弹窗 */}
      <GenerationModal
        generation={generation}
        images={images}
        onClose={handleCloseModal}
        onRestart={handleRestart}
        onViewCollage={handleViewCollage}
      />

      {/* 头部导航 - 优化设计 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/zh"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">返回首页</span>
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

      {/* 主要内容 - 全新布局 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 页面标题区域 - 增强设计 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">AI 智能拼图创作</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            创建你的
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              专属拼图
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            上传您的照片，选择喜欢的风格，AI 将为您生成独一无二的精美拼图作品
          </p>
        </div>

        {/* 进度指示器 - 简化为两步 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1.5 rounded-full transition-all ${
              hasImages ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                hasImages ? 'bg-green-500' : 'bg-blue-500'
              }`} />
              <span className="text-sm font-medium">
                {hasImages ? `已上传 ${images.length} 张图片` : '上传图片'}
              </span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-300" />
            
            <div className={`flex items-center px-3 py-1.5 rounded-full transition-all ${
              canGenerate ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                canGenerate ? 'bg-purple-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium">生成拼图</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：图片上传和生成按钮 - 简化布局 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 图片上传区域 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    上传图片
                  </h2>
                  <p className="text-sm text-gray-600">支持 JPG、PNG 格式，最多上传 10 张</p>
                </div>
              </div>
              
              <ImageUploader
                maxImages={10}
                onImagesChange={handleImagesChange}
                disabled={generation.status !== 'idle'}
              />
              
              {images.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      已成功上传 {images.length} 张图片
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 生成按钮区域 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    一键生成
                  </h2>
                  <p className="text-sm text-gray-600">选择好风格后点击生成您的专属拼图</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* 积分/试用信息 */}
                {user ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          消耗 5 积分生成拼图
                        </p>
                        <p className="text-sm text-gray-600">
                          当前余额: <span className="font-medium text-blue-600">{userCredits} 积分</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mr-3">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          免费体验 3 次
                        </p>
                        <p className="text-sm text-gray-600">
                          试用用户可免费生成，注册后获得更多积分
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 生成按钮 */}
                <button
                  onClick={handleGenerateCollage}
                  disabled={!canGenerate}
                  className={`
                    w-full group relative overflow-hidden rounded-2xl font-semibold text-base transition-all duration-300 transform
                    ${canGenerate
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 hover:scale-105 shadow-xl hover:shadow-2xl'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-center px-6 py-4">
                    <Wand2 className={`w-5 h-5 mr-2 ${canGenerate ? 'animate-pulse' : ''}`} />
                    <span>一键生成 AI 拼图</span>
                  </div>
                  
                  {canGenerate && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  )}
                </button>

                {/* 提示信息 */}
                {!hasImages && (
                  <div className="text-center py-3">
                    <p className="text-sm text-gray-500">
                      👆 请先上传至少一张图片开始创作
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：偏好设置 - 简化设计 */}
          <div className="lg:col-span-2">
            {/* 偏好设置 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    个性化设置
                  </h2>
                  <p className="text-sm text-gray-600">选择您喜欢的风格和主题</p>
                </div>
              </div>
              
              <PreferenceSelector
                preferences={preferences}
                onChange={handlePreferencesChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 