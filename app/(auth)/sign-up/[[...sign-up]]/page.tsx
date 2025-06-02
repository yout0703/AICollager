import { SignUp } from '@clerk/nextjs';

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { return_url?: string };
}) {
  const returnUrl = searchParams.return_url;
  const fallbackRedirectUrl = returnUrl || "/";

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp 
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </div>
  );
}
