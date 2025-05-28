'use client';

import React from 'react';
import { getDictionary, getTranslation, type Locale } from '@/lib/i18n';
import { CreditsBadge } from './CreditsBadge';
import { InviteModal } from '../invite/InviteModal';
import { ResponsiveWrapper, ResponsiveButton } from './ResponsiveWrapper';
import { LazyImage } from './LazyImage';

interface MultiLanguageExampleProps {
  locale: Locale;
}

export function MultiLanguageExample({ locale }: MultiLanguageExampleProps) {
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [message, setMessage] = React.useState<string>('');
  const dict = getDictionary(locale);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAction = () => {
    showMessage(getTranslation(dict, 'editor.saveSuccess'));
  };

  const handleError = () => {
    showMessage(getTranslation(dict, 'errors.networkError'));
  };

  const handleInvite = () => {
    setShowInviteModal(true);
    showMessage(getTranslation(dict, 'invite.inviteSuccess'));
  };

  return (
    <ResponsiveWrapper className="p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        {/* 消息提示 */}
        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm text-center">
            {message}
          </div>
        )}

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getTranslation(dict, 'appName')}
          </h1>
          <p className="text-lg text-gray-600">
            {getTranslation(dict, 'tagline')}
          </p>
        </div>

        {/* 功能展示区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 积分系统卡片 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {getTranslation(dict, 'credits.title')}
            </h3>
            <CreditsBadge
              credits={150}
              variant="detailed"
              locale={locale}
              onAddCredits={() => setShowInviteModal(true)}
            />
          </div>

          {/* AI生成卡片 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {getTranslation(dict, 'ai.generate')}
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {getTranslation(dict, 'ai.costNotice')}
              </p>
              <ResponsiveButton 
                onClick={handleAction}
                className="w-full"
              >
                {getTranslation(dict, 'ai.oneClickCollage')}
              </ResponsiveButton>
            </div>
          </div>

          {/* 编辑器卡片 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {getTranslation(dict, 'editor.title')}
            </h3>
            <div className="space-y-3">
              <LazyImage
                src="/preview.png"
                alt={getTranslation(dict, 'editor.canvas')}
                className="w-full h-32 rounded-lg"
                aspectRatio="16/9"
              />
              <ResponsiveButton 
                onClick={() => window.open('/editor/test', '_blank')}
                variant="outline"
                className="w-full"
              >
                {getTranslation(dict, 'nav.editor')}
              </ResponsiveButton>
            </div>
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className="flex flex-wrap gap-4 justify-center">
          <ResponsiveButton onClick={handleAction}>
            {getTranslation(dict, 'editor.save')}
          </ResponsiveButton>
          
          <ResponsiveButton 
            onClick={handleError}
            variant="outline"
          >
            {getTranslation(dict, 'ui.retry')}
          </ResponsiveButton>
          
          <ResponsiveButton 
            onClick={handleInvite}
            variant="secondary"
          >
            {getTranslation(dict, 'invite.title')}
          </ResponsiveButton>
        </div>

        {/* 导航示例 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            {getTranslation(dict, 'nav.home')}
          </h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white rounded-full text-sm border">
              {getTranslation(dict, 'nav.create')}
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm border">
              {getTranslation(dict, 'nav.gallery')}
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm border">
              {getTranslation(dict, 'nav.pricing')}
            </span>
          </div>
        </div>

        {/* 状态示例 */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <div className="text-blue-600 font-medium">
              {getTranslation(dict, 'loading')}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <div className="text-green-600 font-medium">
              {getTranslation(dict, 'editor.saveSuccess')}
            </div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
            <div className="text-yellow-600 font-medium">
              {getTranslation(dict, 'processing')}
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
            <div className="text-red-600 font-medium">
              {getTranslation(dict, 'errors.networkError')}
            </div>
          </div>
        </div>

        {/* 价格示例 */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            {getTranslation(dict, 'pricing.title')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['free', 'basic', 'pro'].map((plan) => (
              <div key={plan} className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <h5 className="text-lg font-semibold text-gray-900 mb-2">
                  {getTranslation(dict, `pricing.${plan}.title`)}
                </h5>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {getTranslation(dict, `pricing.${plan}.price`)}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {getTranslation(dict, `pricing.${plan}.description`)}
                </p>
                <ResponsiveButton 
                  variant={plan === 'pro' ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan === 'free' ? getTranslation(dict, 'ui.view') : getTranslation(dict, 'nav.signUp')}
                </ResponsiveButton>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 邀请弹窗 */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        locale={locale}
      />
    </ResponsiveWrapper>
  );
}

export default MultiLanguageExample; 