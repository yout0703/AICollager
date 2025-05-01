import "./globals.css";

import { Toaster, toast } from "sonner";

import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI 图像拼贴工具 | AICollager",
  description:
    "AI 图像拼贴工具，利用 AI 技术创建精美的图像拼贴和设计作品。",
  keywords: "AI 图像拼贴, 图像设计, AI 设计, AICollager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Toaster position="top-center" richColors />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
