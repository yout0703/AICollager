"use client";
import { SignIn } from "@clerk/nextjs";

interface SignInPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ return_url?: string }>;
}

export default function SignInPage(props: SignInPageProps) {
  return <SignInPageContent {...props} />;
}

async function SignInPageContent({
  params,
  searchParams,
}: SignInPageProps) {
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