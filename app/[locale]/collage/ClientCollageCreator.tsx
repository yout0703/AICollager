"use client";

import { Locale, Dictionary } from "@/lib/i18n";
import dynamic from "next/dynamic";

// 拼图编辑器依赖浏览器 API，必须客户端动态加载。
const CollageWorkspace = dynamic(
  () => import("@/components/collage/v2/CollageWorkspaceEntry"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center text-sm text-muted-foreground">
        正在加载编辑器…
      </div>
    ),
  }
);

interface ClientCollageCreatorProps {
  dict: Dictionary;
  locale: Locale;
}

export default function ClientCollageCreator({ dict, locale }: ClientCollageCreatorProps) {
  return <CollageWorkspace dict={dict} locale={locale} />;
}
