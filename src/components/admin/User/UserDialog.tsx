"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil } from "lucide-react";
import { CreateUserForm, EditUserForm } from "./UserForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { UserDto } from "@/lib/db/schema";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </DialogTrigger>
        <DialogContent>
          <CreateUserForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EditUserDialog({ user }: { user: UserDto }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <EditUserForm user={user} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
