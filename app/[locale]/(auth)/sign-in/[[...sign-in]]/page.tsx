"use client";
import { SignIn } from "@clerk/nextjs";
import { useParams, useSearchParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  
  // 获取 returnUrl 参数，如果存在则用作登录后的重定向
  const returnUrl = searchParams.get('returnUrl');
  const afterSignInUrl = returnUrl || `/${locale}`;
  
  return (
    <div className="flex justify-center items-center min-h-screen py-12">
      <SignIn 
        routing="path"
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/sign-up`}
        redirectUrl={afterSignInUrl}
        afterSignInUrl={afterSignInUrl}
      />
    </div>
  );
} 