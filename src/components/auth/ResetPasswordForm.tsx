"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FormInput } from "@/components/FormInput";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPassword, null);

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your new password below to reset your account password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <input name="reset-token" id="reset-token" value={token} readOnly hidden />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <FormInput
                label="New Password"
                id="password"
                type="password"
                placeholder="Enter your new password"
                defaultValue={state?.inputs?.password}
                error={state?.errors?.password?.[0]}
                required
                minLength={6}
                maxLength={16}
              />
            </div>
            <div className="grid gap-2">
              <FormInput
                label="Confirm New Password"
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                defaultValue={state?.inputs?.confirmPassword}
                error={state?.errors?.confirmPassword?.[0]}
                required
                minLength={6}
                maxLength={16}
              />
            </div>
            <SubmitButton className="w-full">Reset Password</SubmitButton>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <ServerActionAlertMessage state={state} />
        {state?.success && (
          <Link href={"/login"} className="underline">
            Back to Login
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
