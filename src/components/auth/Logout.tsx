"use client";

import { logout } from "@/app/actions/auth";

export default function Logout() {
  return <button onClick={() => logout()}>Sign out</button>;
}
