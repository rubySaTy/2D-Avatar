"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import Link from "next/link";

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
          <input
            name="resetToken"
            id="resetToken"
            value={token}
            readOnly
            hidden
          />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your new password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
            required
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
