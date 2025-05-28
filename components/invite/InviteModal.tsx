'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Share2, Gift, Users, Check } from 'lucide-react';
import { getDictionary, getTranslation, type Locale } from '@/lib/i18n';
import { toastSuccess, toastError } from '@/lib/toast';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: Locale;
}

interface InviteData {
  inviteCode: string;
  inviteUrl: string;
  totalInvites: number;
  earnedCredits: number;
  pendingInvites: number;
}

export function InviteModal({ 
  isOpen, 
  onClose,
  locale = 'zh'
}: InviteModalProps) {
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const dict = getDictionary(locale);

  // 获取邀请数据
  useEffect(() => {
    if (isOpen) {
      fetchInviteData();
    }
  }, [isOpen]);

  const fetchInviteData = async () => {
    try {
      setLoading(true);
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInviteData({
        inviteCode: 'FRIEND2024',
        inviteUrl: `${window.location.origin}/invite/FRIEND2024`,
        totalInvites: 5,
        earnedCredits: 100,
        pendingInvites: 2
      });
    } catch (error) {
      toastError('common.error', locale);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toastSuccess('invite.copySuccess', locale);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toastError('invite.copyError', locale);
    }
  };

  const shareInvite = async () => {
    if (!inviteData) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: getTranslation(dict, 'invite.shareTitle'),
          text: getTranslation(dict, 'invite.shareText'),
          url: inviteData.inviteUrl,
        });
      } catch (error) {
        // 用户取消分享，不显示错误
      }
    } else {
      // 降级到复制链接
      copyToClipboard(inviteData.inviteUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {getTranslation(dict, 'invite.title')}
              </h2>
              <p className="text-sm text-gray-500">
                {getTranslation(dict, 'invite.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : inviteData ? (
            <div className="space-y-6">
              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{inviteData.totalInvites}</div>
                  <div className="text-sm text-gray-600">{getTranslation(dict, 'invite.totalInvites')}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{inviteData.earnedCredits}</div>
                  <div className="text-sm text-gray-600">{getTranslation(dict, 'invite.earnedCredits')}</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">{inviteData.pendingInvites}</div>
                  <div className="text-sm text-gray-600">{getTranslation(dict, 'invite.pendingInvites')}</div>
                </div>
              </div>

              {/* 邀请码 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {getTranslation(dict, 'invite.inviteCode')}
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg">
                    {inviteData.inviteCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(inviteData.inviteCode)}
                    className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 邀请链接 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {getTranslation(dict, 'invite.inviteLink')}
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm truncate">
                    {inviteData.inviteUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(inviteData.inviteUrl)}
                    className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 分享按钮 */}
              <div className="flex space-x-3">
                <button
                  onClick={shareInvite}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{getTranslation(dict, 'invite.share')}</span>
                </button>
              </div>

              {/* 说明文字 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">{getTranslation(dict, 'invite.howItWorks')}</p>
                    <p>{getTranslation(dict, 'invite.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">{getTranslation(dict, 'common.loadError')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InviteModal; 