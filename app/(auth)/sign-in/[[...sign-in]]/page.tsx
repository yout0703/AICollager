"use client";
import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  
  // 获取 returnUrl 参数，如果存在则用作登录后的重定向
  const returnUrl = searchParams.get('returnUrl');
  const afterSignInUrl = returnUrl || "/";
  
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <SignIn 
        routing="path" 
        path="/sign-in" 
        signUpUrl="/sign-up"
        redirectUrl={afterSignInUrl}
        afterSignInUrl={afterSignInUrl}
      />
    </div>
  );
}
