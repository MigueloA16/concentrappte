import AuthForm from "@/components/auth/AuthForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#0f0f1a]">
      <AuthForm view="sign-in" />
    </div>
  );
}