"use client";

import dynamic from "next/dynamic";

// Studio 依赖浏览器 API（上传/交互），客户端动态加载。
const Studio = dynamic(() => import("@/components/studio/Studio"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center text-sm text-muted-foreground">
      正在加载工作室…
    </div>
  ),
});

export default function ClientCollageCreator() {
  return <Studio />;
}
