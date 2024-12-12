import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const { session } = await validateRequest();

  if (session) {
    redirect("/"); // Redirect to home or dashboard if user is already logged in
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 max-w-md mx-auto">
      <LoginForm />
    </div>
  );
}
