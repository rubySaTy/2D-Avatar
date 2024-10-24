"use client";

import { useFormState } from "react-dom";
import { Separator } from "../ui/separator";
import FormCard from "../FormCard";
import UsernamePasswordFields from "./UsernamePasswordFields";
import { SubmitButton } from "../SubmitButton";
import { loginUser } from "@/app/actions/auth";

export default function Login() {
  const [state, formAction] = useFormState(loginUser, null);

  return (
    <FormCard title="Sign in" message={state?.message}>
      <form action={formAction}>
        <div className="grid w-full items-center gap-3 md:gap-4">
          <UsernamePasswordFields />
          <Separator />
          <SubmitButton>Sign in</SubmitButton>
        </div>
      </form>
    </FormCard>
  );
}
