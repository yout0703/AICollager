'use client';

import React from 'react';
import { Coins, Plus, Info } from 'lucide-react';
import { getDictionary, getTranslation, type Locale } from '@/lib/i18n';

interface CreditsBadgeProps {
  credits: number;
  className?: string;
  showAddButton?: boolean;
  onAddCredits?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  isLoading?: boolean;
  locale?: Locale;
}

export function CreditsBadge({
  credits,
  className = '',
  showAddButton = true,
  onAddCredits,
  variant = 'default',
  isLoading = false,
  locale = 'zh'
}: CreditsBadgeProps) {
  const dict = getDictionary(locale);
  
  const formatCredits = (credits: number): string => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`;
    }
    if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  };

  const getCreditsColor = (credits: number): string => {
    if (credits <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (credits <= 10) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (credits <= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusMessage = (credits: number): string => {
    if (credits <= 0) return getTranslation(dict, 'credits.empty');
    if (credits <= 10) return getTranslation(dict, 'credits.lowMessage');
    if (credits <= 50) return getTranslation(dict, 'credits.sufficientMessage');
    return getTranslation(dict, 'credits.abundantMessage');
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
          ${getCreditsColor(credits)}
        `}>
          <Coins className="w-3 h-3 mr-1" />
          {isLoading ? '...' : formatCredits(credits)}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">
            {getTranslation(dict, 'credits.myCredits')}
          </h3>
          <div className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
            ${getCreditsColor(credits)}
          `}>
            <Coins className="w-3 h-3 mr-1" />
            {isLoading ? '...' : credits}
          </div>
        </div>
        
        <div className="flex items-start space-x-2 mb-3">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            {getStatusMessage(credits)}
          </p>
        </div>

        {showAddButton && onAddCredits && (
          <button
            onClick={onAddCredits}
            className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3 mr-1" />
            {getTranslation(dict, 'invite.title')}
          </button>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>{getTranslation(dict, 'credits.costPerCollage').split(':')[0]}:</span>
              <span>5 {getTranslation(dict, 'credits.title')}/{getTranslation(dict, 'ui.view')}</span>
            </div>
            <div className="flex justify-between">
              <span>{getTranslation(dict, 'credits.costPerDownload').split(':')[0]}:</span>
              <span>2 {getTranslation(dict, 'credits.title')}/{getTranslation(dict, 'ui.view')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border
        ${getCreditsColor(credits)}
      `}>
        <Coins className="w-4 h-4 mr-2" />
        <span className="font-semibold">
          {isLoading ? getTranslation(dict, 'loading') : `${credits} ${getTranslation(dict, 'credits.title')}`}
        </span>
      </div>

      {showAddButton && onAddCredits && (
        <button
          onClick={onAddCredits}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3 mr-1" />
          {getTranslation(dict, 'credits.getCredits')}
        </button>
      )}
    </div>
  );
}

export default CreditsBadge; 