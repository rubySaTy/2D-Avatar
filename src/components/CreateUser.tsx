"use client";

import { useFormState } from "react-dom";
import { createUser } from "@/app/actions";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import FormCard from "./FormCard";
import UsernamePasswordFields from "./UsernamePasswordFields";
import { SubmitButton } from "./SubmitButton";

export default function CreateUser() {
  const [state, formAction] = useFormState(createUser, null);

  return (
    <FormCard title="Create an account" message={state?.message}>
      <form action={formAction}>
        <div className="grid w-full items-center gap-3 md:gap-4">
          <UsernamePasswordFields />
          <div className="space-y-3">
            <Label>Role</Label>
            <Separator />
            <RadioGroup
              name="role"
              defaultValue="therapist"
              className="flex justify-evenly"
              required
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin">Admin</Label>
              </div>
              <Separator orientation="vertical" />
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="therapist" id="therapist" />
                <Label htmlFor="therapist">Therapist</Label>
              </div>
            </RadioGroup>
          </div>
          <Separator />
          <SubmitButton>Create account</SubmitButton>
        </div>
      </form>
    </FormCard>
  );
}
