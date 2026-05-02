'use client';

import React, { useState, useEffect } from 'react';
import type { UCMEditorProps, UCMModel } from '@/types/ucm';

export const UCMEditor: React.FC<UCMEditorProps> = ({
  model,
  onChange,
  readOnly = false
}) => {
  const [jsonString, setJsonString] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化和同步 JSON 字符串
  useEffect(() => {
    setJsonString(JSON.stringify(model, null, 2));
  }, [model]);

  // 处理 JSON 输入变化
  const handleJsonChange = (value: string) => {
    setJsonString(value);

    try {
      const parsedModel = JSON.parse(value) as UCMModel;

      // 基本验证
      if (!parsedModel.version || !parsedModel.canvas || !parsedModel.elements) {
        throw new Error('缺少必要字段: version, canvas, elements');
      }

      if (!Array.isArray(parsedModel.elements)) {
        throw new Error('elements 必须是数组');
      }

      setIsValid(true);
      setError(null);

      if (!readOnly) {
        onChange(parsedModel);
      }
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : '无效的 JSON 格式');
    }
  };

  // 格式化 JSON
  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
    } catch {
      // 如果解析失败，保持原样
    }
  };

  // 重置到原始模型
  const resetJson = () => {
    setJsonString(JSON.stringify(model, null, 2));
    setIsValid(true);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-3 h-3 rounded-full ${isValid ? 'bg-accent' : 'bg-destructive'}`}></span>
          <span className="text-sm text-gray-600">
            {isValid ? 'JSON 格式正确' : 'JSON 格式错误'}
          </span>
        </div>

        {!readOnly && (
          <div className="flex space-x-2">
            <button
              onClick={formatJson}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              格式化
            </button>
            <button
              onClick={resetJson}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              重置
            </button>
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          <strong>错误:</strong> {error}
        </div>
      )}

      {/* JSON 编辑器 */}
      <div className="relative">
        <textarea
          value={jsonString}
          onChange={(e) => handleJsonChange(e.target.value)}
          readOnly={readOnly}
          className={`
            w-full h-96 p-4 font-mono text-sm border rounded-lg resize-none
            ${isValid ? 'border-input' : 'border-destructive/30'}
            ${readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          placeholder="输入 UCM JSON 数据..."
          spellCheck={false}
        />

        {/* 行号指示器（简化版） */}
        <div className="absolute top-4 left-2 text-xs text-gray-400 pointer-events-none">
          {jsonString.split('\n').map((_, index) => (
            <div key={index} className="leading-5">
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>行数: {jsonString.split('\n').length}</span>
        <span>字符数: {jsonString.length}</span>
      </div>

      {/* 快速操作面板 */}
      {!readOnly && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">快速操作</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                try {
                  const parsed = JSON.parse(jsonString);
                  parsed.canvas.background.color = '#ffffff';
                  handleJsonChange(JSON.stringify(parsed, null, 2));
                } catch {
                  // 忽略错误
                }
              }}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              设置白色背景
            </button>
            <button
              onClick={() => {
                try {
                  const parsed = JSON.parse(jsonString);
                  parsed.elements.forEach((element: any) => {
                    if (element.style) {
                      element.style.opacity = 1.0;
                    }
                  });
                  handleJsonChange(JSON.stringify(parsed, null, 2));
                } catch {
                  // 忽略错误
                }
              }}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              重置透明度
            </button>
            <button
              onClick={() => {
                try {
                  const parsed = JSON.parse(jsonString);
                  parsed.elements.forEach((element: any) => {
                    element.transform.rotation_degrees = 0;
                  });
                  handleJsonChange(JSON.stringify(parsed, null, 2));
                } catch {
                  // 忽略错误
                }
              }}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              重置旋转
            </button>
            <button
              onClick={() => {
                try {
                  const parsed = JSON.parse(jsonString);
                  parsed.elements.forEach((element: any) => {
                    element.transform.scale = 1.0;
                  });
                  handleJsonChange(JSON.stringify(parsed, null, 2));
                } catch {
                  // 忽略错误
                }
              }}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              重置缩放
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
