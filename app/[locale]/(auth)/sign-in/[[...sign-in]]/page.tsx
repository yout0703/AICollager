import { SignIn } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const locale = params.locale as string;
  
  return (
    <div className="flex justify-center items-center min-h-screen py-12">
      <SignIn 
        redirectUrl={`/${locale}`} 
        afterSignInUrl={`/${locale}`} 
      />
    </div>
  );
} 