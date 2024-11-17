"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { deleteAvatar } from "@/app/actions/admin";
import type { Avatar, UserDto } from "@/lib/db/schema";

type AvatarCardProps = {
  avatar: Avatar;
  users: Array<UserDto>;
  usersToAvatars: Array<{ userId: string; avatarId: number }>;
};

export default function AvatarCard({
  avatar,
  users,
  usersToAvatars,
}: AvatarCardProps) {
  const associatedUsers = users.filter((user) =>
    usersToAvatars.some(
      (relation) =>
        relation.avatarId === avatar.id && relation.userId === user.id
    )
  );
  const [showAllUsers, setShowAllUsers] = useState(false);
  const displayedUsers = showAllUsers
    ? associatedUsers
    : associatedUsers.slice(0, 3);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex items-center space-x-4">
        <Image
          src={avatar.imageUrl}
          alt={avatar.avatarName}
          width={100}
          height={100}
          className="rounded-full"
        />
        <div>
          <CardTitle>{avatar.avatarName}</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {associatedUsers.length > 0
              ? `Associated with ${associatedUsers.length} user${
                  associatedUsers.length > 1 ? "s" : ""
                }`
              : "No associated users"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-600" />
          <div className="text-sm">
            {associatedUsers.length > 0 ? (
              <>
                {displayedUsers.map((user) => (
                  <div key={user.id} className="text-gray-700">
                    {user.username} ({user.email})
                  </div>
                ))}
                {associatedUsers.length > 3 && !showAllUsers && (
                  <button
                    onClick={() => setShowAllUsers(true)}
                    className="text-blue-500 underline text-sm mt-2"
                  >
                    Show more
                  </button>
                )}
                {showAllUsers && (
                  <button
                    onClick={() => setShowAllUsers(false)}
                    className="text-blue-500 underline text-sm mt-2"
                  >
                    Show less
                  </button>
                )}
              </>
            ) : (
              <span className="text-gray-500">No users assigned</span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              TODO: Avatar edit Form {/* <AvatarForm /> */}
            </DialogContent>
          </Dialog>
          <form action={deleteAvatar}>
            <input type="hidden" name="id" value={avatar.id} />
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
