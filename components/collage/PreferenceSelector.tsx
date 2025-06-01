'use client';

import React from 'react';
import { Check, Palette, Sparkles, Layout, Ratio } from 'lucide-react';

export interface CollagePreferences {
  style?: 'modern' | 'vintage' | 'artistic' | 'minimal';
  theme?: 'travel' | 'family' | 'food' | 'pets' | 'celebration';
  colorScheme?: 'auto' | 'warm' | 'cool' | 'monochrome';
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:4' | '9:16' | 'auto';
}

interface PreferenceSelectorProps {
  preferences: CollagePreferences;
  onChange: (preferences: CollagePreferences) => void;
  className?: string;
}

export function PreferenceSelector({
  preferences,
  onChange,
  className = ''
}: PreferenceSelectorProps) {
  const updatePreference = <K extends keyof CollagePreferences>(
    key: K,
    value: CollagePreferences[K]
  ) => {
    onChange({
      ...preferences,
      [key]: value
    });
  };

  const styles = [
    {
      id: 'modern' as const,
      name: '现代风格',
      description: '简洁、清晰的设计语言',
      preview: 'bg-gradient-to-br from-blue-400 to-purple-500'
    },
    {
      id: 'vintage' as const,
      name: '复古风格',
      description: '怀旧、温暖的质感',
      preview: 'bg-gradient-to-br from-orange-400 to-red-500'
    },
    {
      id: 'artistic' as const,
      name: '艺术风格',
      description: '创意、独特的表现形式',
      preview: 'bg-gradient-to-br from-purple-400 to-pink-500'
    },
    {
      id: 'minimal' as const,
      name: '极简风格',
      description: '简约、留白的设计',
      preview: 'bg-gradient-to-br from-gray-300 to-gray-500'
    }
  ];

  const themes = [
    {
      id: 'travel' as const,
      name: '旅行',
      description: '探索世界的美好',
      icon: '🌍',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'family' as const,
      name: '家庭',
      description: '温馨的家庭时光',
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'food' as const,
      name: '美食',
      description: '品味生活的美味',
      icon: '🍽️',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'pets' as const,
      name: '宠物',
      description: '可爱的毛茸茸朋友',
      icon: '🐱',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'celebration' as const,
      name: '庆祝',
      description: '特殊时刻的纪念',
      icon: '🎉',
      color: 'bg-pink-100 text-pink-700'
    }
  ];

  const colorSchemes = [
    {
      id: 'auto' as const,
      name: '智能配色',
      description: 'AI自动分析图片配色',
      preview: ['bg-red-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400']
    },
    {
      id: 'warm' as const,
      name: '暖色调',
      description: '温暖、活力的色彩',
      preview: ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-pink-400']
    },
    {
      id: 'cool' as const,
      name: '冷色调',
      description: '清爽、宁静的色彩',
      preview: ['bg-blue-400', 'bg-teal-400', 'bg-cyan-400', 'bg-indigo-400']
    },
    {
      id: 'monochrome' as const,
      name: '黑白',
      description: '经典的单色调',
      preview: ['bg-gray-800', 'bg-gray-600', 'bg-gray-400', 'bg-gray-200']
    }
  ];

  const aspectRatios = [
    { id: '1:1' as const, name: '方形', description: '社交媒体首选' },
    { id: '4:3' as const, name: '传统横屏', description: '经典照片比例' },
    { id: '16:9' as const, name: '宽屏', description: '电脑屏幕比例' },
    { id: '3:4' as const, name: '传统竖屏', description: '手机竖屏比例' },
    { id: '9:16' as const, name: '竖屏', description: '手机视频比例' },
    { id: 'auto' as const, name: '自适应', description: 'AI智能选择' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 风格选择 */}
      <div>
        <div className="flex items-center mb-2">
          <Sparkles className="w-4 h-4 text-purple-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">选择风格</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => updatePreference('style', style.id)}
              className={`
                relative p-3 rounded-lg border-2 transition-all group
                ${preferences.style === style.id
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                }
              `}
            >
              <div className={`w-full h-10 rounded-lg mb-2 ${style.preview} group-hover:scale-105 transition-transform`} />
              <h4 className="font-medium text-xs text-gray-900">{style.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{style.description}</p>
              {preferences.style === style.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 主题选择 */}
      <div>
        <div className="flex items-center mb-2">
          <Layout className="w-4 h-4 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">选择主题</h3>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => updatePreference('theme', theme.id)}
              className={`
                relative p-2 rounded-lg border-2 transition-all text-center group
                ${preferences.theme === theme.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }
              `}
            >
              <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center ${theme.color} group-hover:scale-110 transition-transform`}>
                <span className="text-xs">{theme.icon}</span>
              </div>
              <h4 className="font-medium text-xs text-gray-900">{theme.name}</h4>
              {preferences.theme === theme.id && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 配色方案 */}
      <div>
        <div className="flex items-center mb-2">
          <Palette className="w-4 h-4 text-green-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">配色方案</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => updatePreference('colorScheme', scheme.id)}
              className={`
                relative p-3 rounded-lg border-2 transition-all group
                ${preferences.colorScheme === scheme.id
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex space-x-0.5 mb-2 group-hover:scale-105 transition-transform">
                {scheme.preview.map((color, index) => (
                  <div key={index} className={`flex-1 h-5 rounded ${color}`} />
                ))}
              </div>
              <h4 className="font-medium text-xs text-gray-900">{scheme.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{scheme.description}</p>
              {preferences.colorScheme === scheme.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 画布比例 */}
      <div>
        <div className="flex items-center mb-2">
          <Ratio className="w-4 h-4 text-indigo-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">画布比例</h3>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => updatePreference('aspectRatio', ratio.id)}
              className={`
                relative p-2.5 rounded-lg border-2 transition-all text-center group
                ${preferences.aspectRatio === ratio.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                }
              `}
            >
              <h4 className="font-medium text-xs text-gray-900 group-hover:scale-105 transition-transform">{ratio.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{ratio.description}</p>
              {preferences.aspectRatio === ratio.id && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PreferenceSelector; 