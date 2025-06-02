import "./globals.css";

import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import UserProvider from "@/components/providers/UserProvider";

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
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <UserProvider>
            {children}
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              containerClassName=""
              containerStyle={{}}
              toastOptions={{
                // 默认配置
                className: '',
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                // 成功消息样式
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                  },
                },
                // 错误消息样式
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
            <Analytics />
          </UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
