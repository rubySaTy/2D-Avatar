"use client";

import { useState, useActionState } from "react";
import { Separator } from "../ui/separator";
import FormCard from "../FormCard";
import { SubmitButton } from "../SubmitButton";
import { loginUser } from "@/app/actions/auth";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EyeOff, Eye } from "lucide-react";

export default function Login() {
  const [state, formAction] = useActionState(loginUser, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormCard title="Sign in" state={state}>
      <form action={formAction}>
        <div className="grid w-full items-center gap-3 md:gap-4">
          <Label htmlFor="identifier">Username or Email</Label>
          <Input
            id="identifier"
            name="identifier"
            placeholder="Username or Email"
            required
            autoFocus
          />
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Separator />
          <SubmitButton>Sign in</SubmitButton>
        </div>
      </form>
    </FormCard>
  );
}
