"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/FormInput";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import PasswordInputWithToggle from "@/components/PasswordInputWithToggle";

export function LoginForm() {
  const [state, formAction] = useActionState(loginUser, null);

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your username or email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <FormInput
                label="Username or Email"
                id="identifier"
                placeholder="m@example.com"
                defaultValue={state?.inputs?.identifier}
                error={state?.errors?.identifier?.[0]}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                  tabIndex={-1}
                >
                  Forgot your password?
                </Link>
              </div>
              <PasswordInputWithToggle
                data={state?.inputs?.password}
                error={!!state?.errors?.password}
              />
              {state?.errors?.password && (
                <p
                  id="password-error"
                  className="text-sm text-destructive [&>svg]:text-destructive"
                >
                  {state.errors.password[0]}
                </p>
              )}
            </div>
            <SubmitButton className="w-full">Login</SubmitButton>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <ServerActionAlertMessage state={state} />
      </CardFooter>
    </Card>
  );
}
