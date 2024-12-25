"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { UserDto } from "@/lib/db/schema";

interface MultiUserSelectorProps {
  users: Array<UserDto>;
  associatedUsers: Array<UserDto>;
  currentUserId: string;
}

export default function MultiUserSelector({
  users,
  currentUserId,
  associatedUsers,
}: MultiUserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] =
    useState<Array<UserDto>>(associatedUsers);

  const toggleUser = (user: UserDto) => {
    setSelectedUsers((current) =>
      current.some((selectedUser) => selectedUser.id === user.id)
        ? current.filter((selectedUser) => selectedUser.id !== user.id)
        : [...current, user]
    );
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((current) =>
      current.filter((selectedUser) => selectedUser.id !== userId)
    );
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Select users
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem key={user.id} onSelect={() => toggleUser(user)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUsers.some(
                          (selectedUser) => selectedUser.id === user.id
                        )
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {currentUserId === user.id ? (
                      <b>{user.username} (You)</b>
                    ) : (
                      user.username
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {selectedUsers.map((user) => (
          <Badge key={user.id} variant="secondary">
            {user.username}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-4 w-4 p-0"
              onClick={() => removeUser(user.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {selectedUsers.map((user) => (
        <input key={user.id} type="hidden" name="associated-users-ids" value={user.id} />
      ))}
    </div>
  );
}
