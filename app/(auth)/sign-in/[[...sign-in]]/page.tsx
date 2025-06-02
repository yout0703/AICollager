"use client";
import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignInPage({
  searchParams,
}: {
  searchParams: { return_url?: string };
}) {
  const returnUrl = searchParams.return_url;
  const fallbackRedirectUrl = returnUrl || "/";

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </div>
  );
}
