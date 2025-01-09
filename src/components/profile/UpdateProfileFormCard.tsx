"use client";

import { useActionState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormInput } from "@/components/FormInput";
import { updateUserAction } from "@/app/actions/user";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import type { User } from "lucia";

export function UpdateProfileFormCard({ user }: { user: User }) {
  const [state, formAction] = useActionState(updateUserAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your profile details here</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <FormInput
              label="Username"
              id="username"
              defaultValue={state?.inputs?.username ?? user.username}
              error={state?.errors?.username?.[0]}
              required
              minLength={3}
              maxLength={30}
            />
          </div>
          <div className="space-y-2">
            <FormInput
              label="Email"
              id="email"
              type="email"
              defaultValue={state?.inputs?.email ?? user.email}
              error={state?.errors?.email?.[0]}
              required
            />
          </div>
          <ServerActionAlertMessage state={state} />
        </CardContent>
        <CardFooter>
          <SubmitButton>Save Changes</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
