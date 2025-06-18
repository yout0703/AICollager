'use client';

import { useState } from 'react';
import { UCMRenderer } from '@/components/ucm/UCMRenderer';
import { UCMEditor } from '@/components/ucm/UCMEditor';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { UCMModel } from '@/types/ucm';

// 默认的 UCM JSON 模板（基于设计文档示例）
const DEFAULT_UCM: UCMModel = {
  version: "1.2",
  name: "AI生成的剪贴簿",
  metadata: {
    sourceTemplateId: "scrapbook_style_05",
    aiEngineVersion: "v2.5",
    aiDetectedTheme: "travel_journal",
    aiUsedPalette: ["#3A3F44", "#F4F4F4", "#C6B09E", "#8E8071"]
  },
  canvas: {
    units: "px",
    width: 1080,
    height: 1920,
    background: {
      type: "color",
      color: "#F4F4F4"
    }
  },
  elements: [
    {
      id: "img_e8fa1b",
      type: "image",
      zIndex: 2,
      source: "placeholder_image_1",
      position: { x: 540, y: 600 },
      dimensions: { width: 750, height: 1000 },
      transform: {
        rotation_degrees: -7.5,
        scale: 1.0,
        flip_horizontal: false,
        transformOrigin: { x: 0.5, y: 0.5 }
      },
      style: {
        opacity: 1.0,
        borderRadius: 25,
        objectFit: "cover",
        border: {
          width: 20,
          color: "#FFFFFF"
        },
        shadow: {
          offsetX: 8,
          offsetY: 8,
          blur: 20,
          color: "rgba(0, 0, 0, 0.2)"
        }
      }
    },
    {
      id: "text_c3a0f4",
      type: "text",
      zIndex: 3,
      content: "Our Journey",
      position: { x: 120, y: 250 },
      dimensions: { width: 600, height: 100 },
      transform: {
        rotation_degrees: 0,
        scale: 1.0,
        flip_horizontal: false,
        transformOrigin: { x: 0.5, y: 0.5 }
      },
      style: {
        font: {
          family: "'Dancing Script', cursive",
          size: 96,
          weight: "700",
          align: "left",
          lineHeight: 1.2
        },
        color: "#3A3F44",
        opacity: 1.0,
        border: null,
        shadow: null
      }
    },
    {
      id: "img_grid_simple",
      type: "image",
      zIndex: 1,
      source: "placeholder_image_2",
      position: { x: 100, y: 1200 },
      dimensions: { width: 400, height: 400 },
      transform: {
        rotation_degrees: 0,
        scale: 1.0,
        flip_horizontal: false,
        transformOrigin: { x: 0.5, y: 0.5 }
      },
      style: {
        opacity: 1.0,
        borderRadius: 0,
        objectFit: "cover",
        border: null,
        shadow: null
      }
    }
  ]
};

export default function UCMTestPage() {
  const [ucmModel, setUcmModel] = useState<UCMModel>(DEFAULT_UCM);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [scale, setScale] = useState(0.15);

  const handleImageUpload = (imageFiles: any[]) => {
    // 从 ImageFile 对象中提取 URL
    const imageUrls = imageFiles.map(imageFile => imageFile.preview);
    setUploadedImages(imageUrls);
    
    // 智能替换 UCM 模型中的图片
    const updatedModel = { ...ucmModel };
    
    // 找出所有图片元素
    const imageElements = updatedModel.elements.filter((element: any) => element.type === 'image');
    
    // 按照 zIndex 排序，优先替换层级较高的图片
    imageElements.sort((a: any, b: any) => b.zIndex - a.zIndex);
    
    // 替换图片源
    updatedModel.elements = updatedModel.elements.map((element: any) => {
      if (element.type === 'image') {
        // 找到当前图片在排序后数组中的索引
        const sortedIndex = imageElements.findIndex((img: any) => img.id === element.id);
        
        // 如果有对应的上传图片，就替换
        if (sortedIndex < imageUrls.length) {
          return {
            ...element,
            source: imageUrls[sortedIndex]
          };
        }
        
        // 如果没有足够的图片，但是是占位符，则保持占位符状态
        if (element.source.startsWith('placeholder_') || element.source.includes('placeholder')) {
          return element;
        }
        
        // 如果是真实图片但没有新图片替换，保持原状
        return element;
      }
      return element;
    });
    
    setUcmModel(updatedModel);
  };

  const handleJsonUpdate = (newModel: UCMModel) => {
    setUcmModel(newModel);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            UCM 万能拼接模型测试页面
          </h1>
          <p className="text-gray-600">
            基于最新设计文档的 Universal Collage Model，上传图片并查看拼图效果
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：控制面板 */}
          <div className="space-y-6">
            {/* 图片上传区域 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">上传图片</h2>
              <ImageUploader
                onImagesChange={handleImageUpload}
                maxImages={5}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              />
              
              {uploadedImages.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      已上传图片 ({uploadedImages.length})
                    </h3>
                    <button
                      onClick={() => {
                        // 清理所有图片 URL
                        uploadedImages.forEach(url => URL.revokeObjectURL(url));
                        setUploadedImages([]);
                        
                        // 重置模型为默认状态
                        setUcmModel(DEFAULT_UCM);
                      }}
                      className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                    >
                      清空图片
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`上传图片 ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <span className="text-white text-xs">图片 {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* JSON 编辑器 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">UCM JSON 模型</h2>
                <button
                  onClick={() => setShowJsonEditor(!showJsonEditor)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {showJsonEditor ? '隐藏编辑器' : '显示编辑器'}
                </button>
              </div>
              
              {showJsonEditor && (
                <UCMEditor
                  model={ucmModel}
                  onChange={handleJsonUpdate}
                />
              )}
              
              {!showJsonEditor && (
                <div className="bg-gray-100 rounded p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-700">
                    {JSON.stringify(ucmModel, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* 模型信息 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">模型信息</h2>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">版本:</span> {ucmModel.version}</div>
                <div><span className="font-medium">名称:</span> {ucmModel.name}</div>
                <div><span className="font-medium">画布尺寸:</span> {ucmModel.canvas.width} × {ucmModel.canvas.height}</div>
                <div><span className="font-medium">元素数量:</span> {ucmModel.elements.length}</div>
                <div><span className="font-medium">AI 主题:</span> {ucmModel.metadata.aiDetectedTheme}</div>
              </div>
            </div>

            {/* 快速模板 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">快速模板</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const simpleTemplate = {
                      ...DEFAULT_UCM,
                      name: "简单双图布局",
                      canvas: { ...DEFAULT_UCM.canvas, width: 800, height: 600 },
                      elements: [
                        {
                          ...DEFAULT_UCM.elements[0],
                          position: { x: 50, y: 50 },
                          dimensions: { width: 350, height: 250 },
                          source: "placeholder_image_1"
                        },
                        {
                          ...DEFAULT_UCM.elements[2],
                          position: { x: 450, y: 300 },
                          dimensions: { width: 300, height: 200 },
                          source: "placeholder_image_2"
                        }
                      ]
                    };
                    setUcmModel(simpleTemplate);
                  }}
                  className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                >
                  简单双图
                </button>
                <button
                  onClick={() => {
                    setUcmModel(DEFAULT_UCM);
                  }}
                  className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  复古剪贴簿
                </button>
                <button
                  onClick={() => {
                    const gridTemplate = {
                      ...DEFAULT_UCM,
                      name: "网格布局",
                      canvas: { ...DEFAULT_UCM.canvas, width: 600, height: 600 },
                      elements: [
                        {
                          ...DEFAULT_UCM.elements[0],
                          position: { x: 50, y: 50 },
                          dimensions: { width: 250, height: 250 },
                          source: "placeholder_image_1",
                          transform: { ...DEFAULT_UCM.elements[0].transform, rotation_degrees: 0 }
                        },
                        {
                          ...DEFAULT_UCM.elements[0],
                          id: "img_grid_2",
                          position: { x: 320, y: 50 },
                          dimensions: { width: 250, height: 250 },
                          source: "placeholder_image_2",
                          transform: { ...DEFAULT_UCM.elements[0].transform, rotation_degrees: 0 }
                        },
                        {
                          ...DEFAULT_UCM.elements[0],
                          id: "img_grid_3",
                          position: { x: 50, y: 320 },
                          dimensions: { width: 250, height: 250 },
                          source: "placeholder_image_3",
                          transform: { ...DEFAULT_UCM.elements[0].transform, rotation_degrees: 0 }
                        },
                        {
                          ...DEFAULT_UCM.elements[0],
                          id: "img_grid_4",
                          position: { x: 320, y: 320 },
                          dimensions: { width: 250, height: 250 },
                          source: "placeholder_image_4",
                          transform: { ...DEFAULT_UCM.elements[0].transform, rotation_degrees: 0 }
                        }
                      ]
                    };
                    setUcmModel(gridTemplate);
                  }}
                  className="px-3 py-2 text-xs bg-green-100 hover:bg-green-200 rounded"
                >
                  网格布局
                </button>
                <button
                  onClick={() => {
                    const collageTemplate = {
                      ...DEFAULT_UCM,
                      name: "随机拼贴",
                      canvas: { ...DEFAULT_UCM.canvas, width: 800, height: 800 },
                      elements: [
                        {
                          ...DEFAULT_UCM.elements[0],
                          position: { x: 100, y: 100 },
                          dimensions: { width: 200, height: 300 },
                          source: "placeholder_image_1",
                          transform: { ...DEFAULT_UCM.elements[0].transform, rotation_degrees: -15 }
                        },
                        {
                          ...DEFAULT_UCM.elements[0],
                          id: "img_random_2",
                          position: { x: 350, y: 80 },
                          dimensions: { width: 250, height: 200 },
                          source: "placeholder_image_2",
                          transform: { ...DEFAULT_UCM.elements[0].transform, rotation_degrees: 8 }
                        },
                        {
                          ...DEFAULT_UCM.elements[0],
                          id: "img_random_3",
                          position: { x: 150, y: 450 },
                          dimensions: { width: 300, height: 200 },
                          source: "placeholder_image_3",
                          transform: { ...DEFAULT_UCM.elements[0].transform, rotation_degrees: -5 }
                        },
                        {
                          ...DEFAULT_UCM.elements[1],
                          content: "My Photos",
                          position: { x: 500, y: 350 },
                          dimensions: { width: 250, height: 80 },
                        }
                      ]
                    };
                    setUcmModel(collageTemplate);
                  }}
                  className="px-3 py-2 text-xs bg-purple-100 hover:bg-purple-200 rounded"
                >
                  随机拼贴
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：拼图预览 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">拼图预览</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">缩放:</span>
                <select
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value={0.1}>10%</option>
                  <option value={0.15}>15%</option>
                  <option value={0.2}>20%</option>
                  <option value={0.25}>25%</option>
                  <option value={0.3}>30%</option>
                  <option value={0.4}>40%</option>
                  <option value={0.5}>50%</option>
                  <option value={0.75}>75%</option>
                  <option value={1}>100%</option>
                </select>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
              <div className="p-4 bg-gray-50 min-w-fit">
                <UCMRenderer model={ucmModel} scale={scale} />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              实际尺寸: {ucmModel.canvas.width} × {ucmModel.canvas.height} px
              {scale !== 1 && ` (显示: ${Math.round(ucmModel.canvas.width * scale)} × ${Math.round(ucmModel.canvas.height * scale)} px)`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 