"use client";

import { Locale } from "@/lib/i18n";
import dynamic from "next/dynamic";

// 使用动态导入避免预渲染服务器端组件，因为拼图编辑器依赖于浏览器API
const CollageCreator = dynamic(() => import("@/components/collage/CollageCreator"), {
  ssr: false,
  loading: () => <div className="w-full h-96 flex items-center justify-center">Loading editor...</div>
});

interface ClientCollageCreatorProps {
  dict: any;
  locale: Locale;
}

export default function ClientCollageCreator({ dict, locale }: ClientCollageCreatorProps) {
  return <CollageCreator dict={dict} locale={locale} />;
} 