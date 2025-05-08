import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <SignUp 
        routing="path" 
        path="/sign-up" 
        signInUrl="/sign-in"
        redirectUrl="/"
      />
    </div>
  );
}
