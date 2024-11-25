"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SubmitButton } from "../SubmitButton";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import type { UserDto } from "@/lib/db/schema";

interface UserFormProps {
  serverAction: (
    prevState: any,
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
  initialData?: Partial<UserDto>;
  title: string;
  description: string;
  submitText: "Create User" | "Update User";
  isEditing?: boolean;
}

export default function UserForm({
  serverAction,
  initialData = {},
  title,
  description,
  submitText,
  isEditing = false,
}: UserFormProps) {
  const [state, formAction] = useFormState(serverAction, null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && formRef.current && !isEditing) {
      formRef.current.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="username" className="text-right">
            Username
          </Label>
          <div className="col-span-3">
            <Input
              id="username"
              name="username"
              defaultValue={initialData.username || ""}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <div className="col-span-3">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData.email || ""}
              required
            />
          </div>
        </div>

        {!isEditing && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <div className="col-span-3 relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">
            User Role
          </Label>
          <div className="col-span-3">
            <Select
              name="role"
              defaultValue={initialData.role || "therapist"}
              required
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="therapist">Therapist</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {state?.message && (
        <Alert
          variant={state.success ? "default" : "destructive"}
          className="mb-4"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <SubmitButton type="submit">{submitText}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
