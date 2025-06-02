"use client";
import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ return_url?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const returnUrl = resolvedSearchParams.return_url;
  const fallbackRedirectUrl = returnUrl || "/";

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </div>
  );
}
