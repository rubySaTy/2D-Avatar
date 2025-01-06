"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputWithToggleProps {
  data?: string;
  error?: boolean;
}

export default function PasswordInputWithToggle({
  data,
  error,
}: PasswordInputWithToggleProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="relative">
      <Input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        defaultValue={data}
        minLength={6}
        maxLength={16}
        required
        className={error ? "border-destructive/50 dark:border-destructive" : ""}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
