"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormInput } from "@/components/FormInput";
import { SubmitButton } from "@/components/SubmitButton";
import { changeUserPasswordAction } from "@/app/actions/user";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";

export function ChangePasswordFormCard() {
  const [state, formAction] = useActionState(changeUserPasswordAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          Change Password
        </CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <FormInput
              label="Current Password"
              id="current-password"
              type="password"
              defaultValue={state?.inputs?.currentPassword}
              error={state?.errors?.currentPassword?.[0]}
              required
            />
          </div>
          <div className="space-y-2">
            <FormInput
              label="New Password"
              id="password"
              type="password"
              defaultValue={state?.inputs?.password}
              error={state?.errors?.password?.[0]}
              required
              minLength={6}
              maxLength={16}
            />
          </div>
          <div className="space-y-2">
            <FormInput
              label="Confirm New Password"
              id="confirm-password"
              type="password"
              defaultValue={state?.inputs?.confirmPassword}
              error={state?.errors?.confirmPassword?.[0]}
              required
              minLength={6}
              maxLength={16}
            />
          </div>
          <ServerActionAlertMessage state={state} />
        </CardContent>
        <CardFooter>
          <SubmitButton>Update Password</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
