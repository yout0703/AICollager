import { locales, defaultLocale } from "../config";

export type Locale = (typeof locales)[number];

// 语言字典类型，支持字符串、对象和数组
export type Dictionary = {
  [key: string]: string | Dictionary | string[];
};

// 获取嵌套属性的类型帮助函数
type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & (string | number)];

// 导入各个模块的翻译
import { commonTranslations } from './modules/common';
import { heroTranslations } from './modules/hero';
import { featuresTranslations } from './modules/features';
import { howItWorksTranslations } from './modules/howItWorks';
import { pricingTranslations } from './modules/pricing';
import { faqTranslations } from './modules/faq';
import { ctaTranslations } from './modules/cta';

// 深层合并函数
function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) return target;
  if (target === null || target === undefined) return source;
  
  // 如果source是基础类型，直接返回
  if (typeof source !== 'object' || Array.isArray(source)) {
    return source;
  }
  
  // 如果target不是对象，用source覆盖
  if (typeof target !== 'object' || Array.isArray(target)) {
    return source;
  }
  
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null &&
          typeof target[key] === 'object' && !Array.isArray(target[key]) && target[key] !== null) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

// 合并所有翻译模块
const createDictionary = (locale: Locale): Dictionary => {
  const modules = [
    (commonTranslations as any)[locale] || {},
    (heroTranslations as any)[locale] || {},
    (featuresTranslations as any)[locale] || {},
    (howItWorksTranslations as any)[locale] || {},
    (pricingTranslations as any)[locale] || {},
    (faqTranslations as any)[locale] || {},
    (ctaTranslations as any)[locale] || {}
  ];
  
  return modules.reduce((acc, module) => deepMerge(acc, module), {});
};

// 语言字典
export const dictionaries: Record<Locale, Dictionary> = {
  en: createDictionary('en'),
  zh: createDictionary('zh'),
  es: createDictionary('es'),
  fr: createDictionary('fr'),
  de: createDictionary('de'),
  ja: createDictionary('ja'),
  ko: createDictionary('ko')
};

// 获取指定语言的字典
export const getDictionary = (locale: Locale) => {
  return dictionaries[locale];
};

// 获取指定语言的嵌套属性
export const getTranslation = (dict: Dictionary, key: string): string => {
  const keys = key.split('.');
  let value: any = dict;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // 如果找不到翻译，返回原始 key
    }
  }

  return typeof value === 'string' ? value : key;
}; 