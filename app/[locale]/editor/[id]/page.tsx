'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditorProvider } from '@/contexts/EditorContext';
import Canvas from '@/components/editor/Canvas';
import Toolbar from '@/components/editor/Toolbar';
import ElementPanel from '@/components/editor/ElementPanel';
import LayerPanel from '@/components/editor/LayerPanel';
import { Button } from '@/components/ui/button';
import { 
  PanelLeft, 
  PanelRight,
  Settings,
  Layers,
  Upload,
  Loader2,
  ArrowLeft,
  Scissors, // 遮罩图标
  Move, // 移动图标
  RotateCw // 旋转图标
} from 'lucide-react';
import { CollageElement, CanvasConfig, ImageElement } from '@/types/collage';
import { exportCanvasToImage, downloadImageDataURL, generateExportFilename } from '@/lib/export';
import { useEditor } from '@/contexts/EditorContext';

// 简化的Tabs组件实现 - 更紧凑的设计
const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
} | null>(null);

const TabsComponent = ({ children, defaultValue, className = '' }: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className} data-active-tab={activeTab}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children }: {
  children: React.ReactNode;
}) => (
  <div className="flex space-x-0.5 bg-gray-50 p-0.5 rounded-md">
    {children}
  </div>
);

const TabsTrigger = ({ value, children }: {
  value: string;
  children: React.ReactNode;
}) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within TabsComponent');
  
  const { activeTab, setActiveTab } = context;
  
  return (
    <button
      className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center ${
        activeTab === value 
          ? 'bg-white shadow-sm text-gray-900' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children }: {
  value: string;
  children: React.ReactNode;
}) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within TabsComponent');
  
  const { activeTab } = context;
  
  return (
    <div className={`${activeTab === value ? 'block' : 'hidden'}`}>
      {children}
    </div>
  );
};

// 遮罩区域面板组件
const MaskRegionPanel = () => {
  const { state, updateElement, selectElement } = useEditor();
  
  // 获取遮罩元素
  const maskElements = state.elements.filter(el => el.maskRegion);
  
  // 处理显示/隐藏切换
  const handleVisibilityToggle = useCallback((elementId: string, newVisibility: boolean) => {
    updateElement(elementId, { isVisible: newVisibility });
  }, [updateElement]);
  
  // 重置图片位置到遮罩中心
  const handleResetPosition = useCallback((elementId: string) => {
    updateElement(elementId, {
      imageTransform: {
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 }
      }
    });
  }, [updateElement]);
  
  // 调整图片缩放
  const handleScaleChange = useCallback((elementId: string, newScale: number) => {
    const element = state.elements.find(el => el.id === elementId);
    if (element && element.type === 'image' && element.imageTransform) {
      updateElement(elementId, {
        imageTransform: {
          ...element.imageTransform,
          scale: newScale
        }
      });
    }
  }, [updateElement, state.elements]);
  
  return (
    <div className="p-3">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-900 mb-2">遮罩区域</h3>
        <p className="text-xs text-gray-600 mb-3">
          洞的位置固定，拖动调整图片在洞内的位置
        </p>
      </div>
      
      {maskElements.length === 0 ? (
        <div className="text-center text-gray-500">
          <Scissors size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">暂无遮罩区域</p>
          <p className="text-xs text-gray-400 mt-1">添加图片时会自动创建遮罩</p>
        </div>
      ) : (
        <div className="space-y-3">
          {maskElements.map((element, index) => {
            const isSelected = state.selectedElementId === element.id;
            return (
              <div
                key={element.id}
                className={`p-3 rounded border transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => selectElement(element.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-900">
                    遮罩 {index + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-200 rounded">
                      {element.maskRegion?.shape === 'circle' ? '圆形' : '矩形'}
                    </span>
                    <input
                      type="checkbox"
                      checked={element.isVisible}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleVisibilityToggle(element.id, e.target.checked);
                      }}
                      className="w-3 h-3 text-blue-600"
                      title="显示/隐藏"
                    />
                  </div>
                </div>
                
                {element.type === 'image' && element.imageTransform && (
                  <div className="space-y-2">
                    {/* 位置信息 */}
                    <div className="text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>图片位置:</span>
                        <span>
                          {Math.round(element.imageTransform.position.x)}, {Math.round(element.imageTransform.position.y)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 缩放控制 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">缩放:</span>
                        <span className="text-xs text-gray-800 font-medium">
                          {Math.round(element.imageTransform.scale * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={element.imageTransform.scale}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleScaleChange(element.id, parseFloat(e.target.value));
                        }}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-1 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetPosition(element.id);
                        }}
                        title="重置到中心位置"
                      >
                        <RotateCw size={10} className="mr-1" />
                        重置
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-900 mb-2">操作提示</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• 点击遮罩区域选中</p>
          <p>• 拖动调整图片位置</p>
          <p>• 滑块调整图片缩放</p>
          <p>• 使用重置按钮居中图片</p>
        </div>
      </div>
    </div>
  );
};

// 内部编辑器组件，可以访问EditorContext
function EditorContent({ 
  onSave, 
  onGoBack 
}: { 
  onSave: () => void; 
  onGoBack: () => void; 
}) {
  const { state } = useEditor();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // 导出拼图
  const handleExport = useCallback(async () => {
    try {
      console.log('导出拼图...');
      
      // 使用我们的导出工具
      const dataURL = await exportCanvasToImage(state.canvas, state.elements, {
        format: 'png',
        quality: 0.9,
        scale: 2 // 2倍分辨率
      });
      
      const filename = generateExportFilename({ format: 'png', quality: 0.9, scale: 2 });
      downloadImageDataURL(dataURL, filename);
      
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  }, [state.canvas, state.elements]);

  // 添加图片
  const handleAddImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        // 处理图片上传
        console.log('上传图片:', files);
        alert('遮罩模式下需要为每张图片指定遮罩区域，功能开发中...');
      }
    };
    
    input.click();
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* 顶部工具栏 - 更紧凑 */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center px-3 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            className="mr-3 h-7 px-2 text-xs"
          >
            <ArrowLeft size={14} className="mr-1" />
            返回
          </Button>
          
          <h1 className="text-sm font-semibold text-gray-900">
            遮罩拼图编辑器
          </h1>
          
          {/* 模式指示器 */}
          <div className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs flex items-center">
            <Scissors size={10} className="mr-1" />
            遮罩模式
          </div>
          
          <div className="flex-1" />
          
          {/* 面板切换按钮 - 更小更紧凑 */}
          <div className="flex items-center space-x-1">
            <Button
              variant={leftPanelOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="h-7 w-7 p-0"
            >
              <PanelLeft size={14} />
            </Button>
            <Button
              variant={rightPanelOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="h-7 w-7 p-0"
            >
              <PanelRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* 工具栏 - 减少高度 */}
      <div className="flex-shrink-0">
        <Toolbar
          onSave={onSave}
          onExport={handleExport}
          onAddImage={handleAddImage}
        />
      </div>

      {/* 主编辑区域 - 填满剩余空间 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧面板 - 更窄 */}
        {leftPanelOpen && (
          <div className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <TabsComponent defaultValue="masks" className="flex-1 flex flex-col min-h-0">
              <div className="p-2 border-b border-gray-100 flex-shrink-0">
                <TabsList>
                  <TabsTrigger value="masks">
                    <Scissors size={12} className="mr-1" />
                    遮罩
                  </TabsTrigger>
                  <TabsTrigger value="assets">
                    <Upload size={12} className="mr-1" />
                    资源
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto min-h-0">
                <TabsContent value="masks">
                  <MaskRegionPanel />
                </TabsContent>
                <TabsContent value="assets">
                  <div className="p-3 text-center text-gray-500">
                    <Upload size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs mb-2">遮罩模式资源库</p>
                    <p className="text-xs mb-3 text-gray-400">
                      图片将自动适配到遮罩区域
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddImage}
                      className="h-7 px-2 text-xs"
                    >
                      上传图片
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </TabsComponent>
          </div>
        )}

        {/* 中央画布区域 - 减少padding */}
        <div className="flex-1 flex items-center justify-center p-2 overflow-auto min-w-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <Canvas className="border border-gray-100 rounded" />
          </div>
        </div>

        {/* 右侧属性面板 - 更窄 */}
        {rightPanelOpen && (
          <div className="w-64 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
            <TabsComponent defaultValue="properties" className="flex-1 flex flex-col min-h-0">
              <div className="p-2 border-b border-gray-100 flex-shrink-0">
                <TabsList>
                  <TabsTrigger value="properties">
                    <Settings size={12} className="mr-1" />
                    遮罩属性
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto min-h-0">
                <TabsContent value="properties">
                  <ElementPanel />
                  
                  {/* 遮罩模式提示信息 */}
                  <div className="mt-4 mx-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center mb-2">
                      <Scissors size={14} className="text-blue-600 mr-2" />
                      <h4 className="text-xs font-medium text-blue-900">遮罩模式</h4>
                    </div>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• 图片被限制在遮罩边界内</li>
                      <li>• 无图层重叠概念</li>
                      <li>• 可在遮罩内移动、旋转、缩放</li>
                      <li>• 超出遮罩部分自动裁剪</li>
                    </ul>
                  </div>
                </TabsContent>
              </div>
            </TabsComponent>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [collageData, setCollageData] = useState<{
    canvas_config: CanvasConfig;
    elements: CollageElement[];
  } | null>(null);

  const collageId = params?.id as string;

  // 加载拼图数据
  useEffect(() => {
    const loadCollageData = async () => {
      setIsLoading(true);
      try {
        console.log('🔍 加载拼图数据:', collageId);
        
        // 如果是特殊的测试ID，创建遮罩模式的测试数据
        if (collageId === 'mask-test') {
          console.log('✨ 创建遮罩拼图测试数据');
          
          const testMaskData = {
            canvas_config: {
              width: 800,
              height: 600,
              aspectRatio: '4:3',
              backgroundColor: '#f8f9fa',
              padding: 20,
              backgroundTexture: {
                type: 'solid' as const,
                value: '#f8f9fa',
                style: '简约'
              }
            },
            elements: [
              {
                id: 'mask-image-1',
                type: 'image' as const,
                zIndex: 1,
                transform: {
                  x: 100,
                  y: 100, 
                  width: 200,
                  height: 200,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  flipX: false,
                  flipY: false
                },
                style: {
                  opacity: 1,
                  borderRadius: 0
                },
                isLocked: false,
                isVisible: true,
                src: 'https://picsum.photos/400/400?random=1',
                originalSrc: 'https://picsum.photos/400/400?random=1',
                // 遮罩区域定义 - 必需字段
                maskRegion: {
                  id: 'mask-1',
                  shape: 'circle' as const,
                  clipPath: 'circle(50%)',
                  position: {
                    x: 100, // 遮罩在画布上的位置
                    y: 100,
                    width: 200,
                    height: 200
                  }
                },
                // 图片在遮罩内的变换 - 必需字段
                imageTransform: {
                  position: { x: -50, y: -50 }, // 图片相对遮罩的偏移
                  scale: 1.2,
                  rotation: 0,
                  anchor: { x: 0.5, y: 0.5 }
                }
              } as ImageElement,
              {
                id: 'mask-image-2',
                type: 'image' as const,
                zIndex: 2,
                transform: {
                  x: 400,
                  y: 150,
                  width: 180,
                  height: 180,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  flipX: false,
                  flipY: false
                },
                style: {
                  opacity: 1,
                  borderRadius: 0
                },
                isLocked: false,
                isVisible: true,
                src: 'https://picsum.photos/400/400?random=2',
                originalSrc: 'https://picsum.photos/400/400?random=2',
                // 遮罩区域定义 - 必需字段
                maskRegion: {
                  id: 'mask-2',
                  shape: 'rectangle' as const,
                  clipPath: 'none',
                  position: {
                    x: 400,
                    y: 150,
                    width: 180,
                    height: 180
                  }
                },
                // 图片在遮罩内的变换 - 必需字段
                imageTransform: {
                  position: { x: -30, y: -30 },
                  scale: 1.1,
                  rotation: 0,
                  anchor: { x: 0.5, y: 0.5 }
                }
              } as ImageElement
            ]
          };
          
          setCollageData(testMaskData);
          setIsLoading(false);
          return;
        }
        
        // 调用API加载拼图数据
        const response = await fetch(`/api/collage/${collageId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || '获取拼图数据失败');
        }
        
        console.log('✅ 拼图数据加载成功:', data.collage);
        
        // 设置拼图数据 - 使用统一的字段名
        setCollageData({
          canvas_config: data.collage.canvas_config,
          elements: data.collage.elements || []
        });
        
      } catch (error) {
        console.error('❌ 加载拼图数据失败:', error);
        alert(error instanceof Error ? error.message : '加载拼图数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (collageId) {
      loadCollageData();
    }
  }, [collageId]);

  // 保存拼图
  const handleSave = useCallback(async () => {
    try {
      console.log('💾 保存拼图修改...');
      
      // TODO: 这里需要获取EditorContext中的当前状态
      // 目前EditorProvider在组件外部，无法直接访问状态
      // 需要将保存逻辑移到EditorContent内部，或者通过回调传递状态
      
      console.log('⚠️  保存功能需要重构：需要访问编辑器当前状态');
      alert('保存功能正在完善中。当前的编辑修改会在内存中保持，导出功能可正常使用。');
      
      // 未来的保存逻辑应该是：
      // const response = await fetch(`/api/collage/${collageId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     canvas_config: currentCanvasConfig,  // 从EditorContext获取
      //     elements: currentElements           // 从EditorContext获取
      //   })
      // });
      
    } catch (error) {
      console.error('❌ 保存失败:', error);
      alert('保存失败，请重试');
    }
  }, [collageId]);

  // 返回画廊
  const handleGoBack = useCallback(() => {
    router.push('/gallery');
  }, [router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-600">加载编辑器中...</p>
        </div>
      </div>
    );
  }

  if (!collageData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">无法加载拼图数据</p>
          <Button onClick={handleGoBack} size="sm">返回画廊</Button>
        </div>
      </div>
    );
  }

  return (
    <EditorProvider
      initialCanvas={collageData.canvas_config}
      initialElements={collageData.elements}
    >
      <EditorContent
        onSave={handleSave}
        onGoBack={handleGoBack}
      />
    </EditorProvider>
  );
} 