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
  ArrowLeft
} from 'lucide-react';
import { CollageElement, CanvasConfig } from '@/types/collage';
import { exportCanvasToImage, downloadImageDataURL, generateExportFilename } from '@/lib/export';
import { useEditor } from '@/contexts/EditorContext';

// 简单的Tabs组件实现
const TabsComponent = ({ children, defaultValue, className = '' }: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={className} data-active-tab={activeTab}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement<{
              activeTab?: string;
              setActiveTab?: (value: string) => void;
            }>, { activeTab, setActiveTab })
          : child
      )}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab }: {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}) => (
  <div className="flex space-x-1 bg-gray-100 p-1 rounded">
    {React.Children.map(children, child => 
      React.isValidElement(child) 
        ? React.cloneElement(child as React.ReactElement<{
            activeTab?: string;
            setActiveTab?: (value: string) => void;
          }>, { activeTab, setActiveTab })
        : child
    )}
  </div>
);

const TabsTrigger = ({ value, children, activeTab, setActiveTab }: {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}) => (
  <button
    className={`px-3 py-1 text-sm rounded transition-colors ${
      activeTab === value 
        ? 'bg-white shadow-sm text-gray-900' 
        : 'text-gray-600 hover:text-gray-900'
    }`}
    onClick={() => setActiveTab?.(value)}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, activeTab }: {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
}) => (
  <div className={`mt-2 ${activeTab === value ? 'block' : 'hidden'}`}>
    {children}
  </div>
);

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
        // 这里应该上传图片并添加到画布
        alert('图片上传功能开发中...');
      }
    };
    
    input.click();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            className="mr-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            返回
          </Button>
          
          <h1 className="text-lg font-semibold">拼图编辑器</h1>
          
          <div className="flex-1" />
          
          {/* 面板切换按钮 */}
          <div className="flex items-center space-x-2">
            <Button
              variant={leftPanelOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            >
              <PanelLeft size={16} />
            </Button>
            <Button
              variant={rightPanelOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
            >
              <PanelRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <Toolbar
        onSave={onSave}
        onExport={handleExport}
        onAddImage={handleAddImage}
      />

      {/* 主编辑区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 */}
        {leftPanelOpen && (
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <TabsComponent defaultValue="layers" className="flex-1 flex flex-col">
              <div className="p-3 border-b border-gray-200">
                <TabsList>
                  <TabsTrigger value="layers">
                    <Layers size={16} className="mr-1" />
                    图层
                  </TabsTrigger>
                  <TabsTrigger value="assets">
                    <Upload size={16} className="mr-1" />
                    资源
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="layers">
                  <LayerPanel />
                </TabsContent>
                <TabsContent value="assets">
                  <div className="p-4 text-center text-gray-500">
                    <Upload size={48} className="mx-auto mb-2 opacity-50" />
                    <p>资源库功能开发中</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddImage}
                      className="mt-2"
                    >
                      上传图片
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </TabsComponent>
          </div>
        )}

        {/* 中央画布区域 */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <Canvas className="border border-gray-200 rounded" />
          </div>
        </div>

        {/* 右侧属性面板 */}
        {rightPanelOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <TabsComponent defaultValue="properties" className="flex-1 flex flex-col">
              <div className="p-3 border-b border-gray-200">
                <TabsList>
                  <TabsTrigger value="properties">
                    <Settings size={16} className="mr-1" />
                    属性
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="properties">
                  <ElementPanel />
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
    canvas: CanvasConfig;
    elements: CollageElement[];
  } | null>(null);

  const collageId = params?.id as string;

  // 模拟加载拼图数据
  useEffect(() => {
    const loadCollageData = async () => {
      setIsLoading(true);
      try {
        // 这里应该调用API加载拼图数据
        // const response = await fetch(`/api/collage/${collageId}`);
        // const data = await response.json();
        
        // 模拟数据
        const mockData = {
          canvas: {
            width: 800,
            height: 600,
            aspectRatio: '4:3',
            backgroundColor: '#ffffff',
            padding: 20,
            borderRadius: 8
          },
          elements: []
        };
        
        setCollageData(mockData);
      } catch (error) {
        console.error('加载拼图数据失败:', error);
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
      // 这里应该调用API保存拼图
      console.log('保存拼图...');
      
      // 模拟保存
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 显示成功消息
      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  }, []);

  // 返回画廊
  const handleGoBack = useCallback(() => {
    router.push('/gallery');
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 size={48} className="animate-spin text-blue-500" />
          <p className="text-gray-600">加载编辑器中...</p>
        </div>
      </div>
    );
  }

  if (!collageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">无法加载拼图数据</p>
          <Button onClick={handleGoBack}>返回画廊</Button>
        </div>
      </div>
    );
  }

  return (
    <EditorProvider
      initialCanvas={collageData.canvas}
      initialElements={collageData.elements}
    >
      <EditorContent
        onSave={handleSave}
        onGoBack={handleGoBack}
      />
    </EditorProvider>
  );
} 