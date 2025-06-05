"use client";
import { SignIn } from "@clerk/nextjs";

interface SignInPageProps {
  searchParams: Promise<{ return_url?: string }>;
}

export default function SignInPage({
  searchParams,
}: SignInPageProps) {
  return <SignInPageContent searchParams={searchParams} />;
}

async function SignInPageContent({
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
