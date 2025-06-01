"use client";
import { SignUp } from "@clerk/nextjs";
import { useParams, useSearchParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  
  // 获取 returnUrl 参数，如果存在则用作注册后的重定向
  const returnUrl = searchParams.get('returnUrl');
  const afterSignUpUrl = returnUrl || `/${locale}`;
  
  return (
    <div className="flex justify-center items-center min-h-screen py-12">
      <SignUp 
        routing="path"
        path={`/${locale}/sign-up`}
        signInUrl={`/${locale}/sign-in`}
        redirectUrl={afterSignUpUrl}
        afterSignUpUrl={afterSignUpUrl}
      />
    </div>
  );
} 