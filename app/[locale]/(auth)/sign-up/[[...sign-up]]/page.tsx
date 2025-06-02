"use client";
import { SignUp } from "@clerk/nextjs";
import { useParams, useSearchParams } from "next/navigation";

export default function SignUpPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { return_url?: string };
}) {
  const { locale } = params;
  const returnUrl = searchParams.return_url;
  const fallbackRedirectUrl = returnUrl || `/${locale}`;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp 
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </div>
  );
} 