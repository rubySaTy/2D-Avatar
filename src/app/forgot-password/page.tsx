import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ForgotPasswordPage() {
  const { session } = await validateRequest();
  if (session) redirect("/");

  return (
    <div className="flex items-center justify-center min-h-screen p-4 max-w-md mx-auto">
      <ForgotPasswordForm />
    </div>
  );
}
