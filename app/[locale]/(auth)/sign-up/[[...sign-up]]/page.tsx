"use client";
import { SignUp } from "@clerk/nextjs";

interface SignUpPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ return_url?: string }>;
}

export default function SignUpPage(props: SignUpPageProps) {
  return <SignUpPageContent {...props} />;
}

async function SignUpPageContent({
  params,
  searchParams,
}: SignUpPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { locale } = resolvedParams;
  const returnUrl = resolvedSearchParams.return_url;
  const fallbackRedirectUrl = returnUrl || `/${locale}`;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp 
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </div>
  );
} 