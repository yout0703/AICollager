import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface ProgressBarProps {
  steps: ProgressStep[];
  currentStep?: number;
  className?: string;
  variant?: 'line' | 'circle' | 'minimal';
  showDescriptions?: boolean;
}

export function ProgressBar({
  steps,
  className = '',
  variant = 'line',
  showDescriptions = true
}: ProgressBarProps) {
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <Circle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStepStyle = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'active':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getConnectorStyle = (index: number) => {
    if (index === steps.length - 1) return '';
    
    const currentStepStatus = steps[index].status;
    
    if (currentStepStatus === 'completed') {
      return 'bg-green-300';
    }
    if (currentStepStatus === 'active') {
      return 'bg-blue-300';
    }
    return 'bg-gray-300';
  };

  if (variant === 'minimal') {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    return (
      <div className={`w-full ${className}`}>
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>进度</span>
          <span>{completedSteps}/{totalSteps}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={`flex items-center justify-center space-x-8 ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className={`
              w-12 h-12 rounded-full border-2 flex items-center justify-center
              ${getStepStyle(step)}
            `}>
              {getStepIcon(step)}
            </div>
            <div className="mt-2 text-center max-w-20">
              <p className="text-xs font-medium text-gray-900">{step.title}</p>
              {showDescriptions && step.description && (
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 默认线性进度条
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* 步骤圆圈 */}
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center
                ${getStepStyle(step)}
              `}>
                {step.status === 'completed' && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                {step.status === 'active' && (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                )}
                {step.status === 'pending' && (
                  <span className="text-xs font-medium text-gray-400">{index + 1}</span>
                )}
                {step.status === 'error' && (
                  <span className="text-xs font-medium text-red-600">!</span>
                )}
              </div>
              
              {/* 步骤信息 */}
              <div className="mt-2 text-center">
                <p className={`
                  text-xs font-medium
                  ${step.status === 'active' ? 'text-blue-600' : ''}
                  ${step.status === 'completed' ? 'text-green-600' : ''}
                  ${step.status === 'error' ? 'text-red-600' : ''}
                  ${step.status === 'pending' ? 'text-gray-500' : ''}
                `}>
                  {step.title}
                </p>
                {showDescriptions && step.description && (
                  <p className="text-xs text-gray-400 mt-1 max-w-20">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div className={`
                  h-0.5 transition-all duration-300
                  ${getConnectorStyle(index)}
                `} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// 拼图生成进度的预定义组件
export function CollageGenerationProgress({ currentStep = 0 }: { currentStep?: number }) {
  const steps: ProgressStep[] = [
    {
      id: 'upload',
      title: '上传图片',
      description: '处理图片文件',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'active' : 'pending'
    },
    {
      id: 'analyze',
      title: 'AI分析',
      description: '分析图片内容',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'pending'
    },
    {
      id: 'layout',
      title: '生成布局',
      description: '智能排版设计',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'pending'
    },
    {
      id: 'complete',
      title: '完成',
      description: '拼图生成完毕',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'pending'
    }
  ];

  return (
    <ProgressBar
      steps={steps}
      currentStep={currentStep}
      variant="line"
      className="max-w-2xl mx-auto"
    />
  );
}

export default ProgressBar; 