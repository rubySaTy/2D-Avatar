"use client";

import { useActionState } from "react";
import { sendResetLink } from "@/app/actions/auth";
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

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(sendResetLink, null);
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Send a reset link</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <SubmitButton className="w-full">Send Reset Link</SubmitButton>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <ServerActionAlertMessage state={state} />
      </CardFooter>
    </Card>
  );
}
