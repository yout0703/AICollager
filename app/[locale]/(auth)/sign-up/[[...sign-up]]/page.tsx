import { SignUp } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const locale = params.locale as string;
  
  return (
    <div className="flex justify-center items-center min-h-screen py-12">
      <SignUp 
        redirectUrl={`/${locale}`} 
        afterSignUpUrl={`/${locale}`} 
      />
    </div>
  );
} 