import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/");

  const { session } = await validateRequest();
  if (session) redirect("/");

  return (
    <div className="flex items-center justify-center min-h-screen p-4 max-w-md mx-auto">
      <ResetPasswordForm token={token} />
    </div>
  );
}
