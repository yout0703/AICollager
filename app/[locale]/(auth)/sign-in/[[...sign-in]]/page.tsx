"use client";
import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ return_url?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { locale } = resolvedParams;
  const returnUrl = resolvedSearchParams.return_url;
  const fallbackRedirectUrl = returnUrl || `/${locale}`;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </div>
  );
} 