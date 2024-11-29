"use client";

import { logout } from "@/app/actions/auth";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { useFormState } from "react-dom";

export default function Logout() {
  const [state, formAction] = useFormState(logout, null);

  return (
    <form action={formAction}>
      <Button variant="link">
        <LogOut /> Log out
      </Button>
    </form>
  );
}
