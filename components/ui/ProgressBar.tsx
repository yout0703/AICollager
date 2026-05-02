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
        return <CheckCircle className="w-5 h-5 text-accent" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'error':
        return <Circle className="w-5 h-5 text-destructive" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground/40" />;
    }
  };

  const getStepStyle = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-accent/10 border-accent/20';
      case 'active':
        return 'bg-primary/10 border-primary/20';
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-secondary border-border';
    }
  };

  const getConnectorStyle = (index: number) => {
    if (index === steps.length - 1) return '';

    const currentStepStatus = steps[index].status;

    if (currentStepStatus === 'completed') {
      return 'bg-accent/40';
    }
    if (currentStepStatus === 'active') {
      return 'bg-primary/40';
    }
    return 'bg-border';
  };

  if (variant === 'minimal') {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    return (
      <div className={`w-full ${className}`}>
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>进度</span>
          <span>{completedSteps}/{totalSteps}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={`flex items-center justify-center space-x-8 ${className}`}>
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className={`
              w-12 h-12 rounded-full border-2 flex items-center justify-center
              ${getStepStyle(step)}
            `}>
              {getStepIcon(step)}
            </div>
            <div className="mt-2 text-center max-w-20">
              <p className="text-xs font-medium text-foreground">{step.title}</p>
              {showDescriptions && step.description && (
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
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
                  <CheckCircle className="w-4 h-4 text-accent" />
                )}
                {step.status === 'active' && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
                {step.status === 'pending' && (
                  <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                )}
                {step.status === 'error' && (
                  <span className="text-xs font-medium text-destructive">!</span>
                )}
              </div>

              {/* 步骤信息 */}
              <div className="mt-2 text-center">
                <p className={`
                  text-xs font-medium
                  ${step.status === 'active' ? 'text-primary' : ''}
                  ${step.status === 'completed' ? 'text-accent' : ''}
                  ${step.status === 'error' ? 'text-destructive' : ''}
                  ${step.status === 'pending' ? 'text-muted-foreground' : ''}
                `}>
                  {step.title}
                </p>
                {showDescriptions && step.description && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-20">
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
