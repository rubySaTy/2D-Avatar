import Image from "next/image";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth";
import { AdminEditAvatarDialog } from "./AvatarDialog";
import { DeleteAvatarAlertDialog } from "./DeleteAvatarAlertDialog";
import type { Avatar, UserDto } from "@/lib/db/schema";

type AvatarCardProps = {
  avatar: Avatar;
  users: Array<UserDto>;
  associatedUsers: Array<UserDto>;
};

export default async function AvatarCard({
  avatar,
  users,
  associatedUsers,
}: AvatarCardProps) {
  const currentUser = await getUser();
  if (!currentUser) return null;

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg dark:bg-gray-900/50 dark:hover:bg-gray-900/80">
      <CardHeader className="pb-2">
        <div className="relative mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full ring-2 ring-primary/20">
          <Image
            src={avatar.imageUrl}
            alt={avatar.avatarName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority
          />
        </div>
        <CardTitle className="text-center text-xl">{avatar.avatarName}</CardTitle>
        <div className="flex justify-center mt-2">
          <Badge variant="secondary" className="mt-1">
            <Users className="mr-1 h-3 w-3" />
            {associatedUsers.length} user{associatedUsers.length !== 1 && "s"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-24 rounded-md border px-4">
          {associatedUsers.length > 0 ? (
            <div className="space-y-2 py-2">
              {associatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="h-2 w-2 rounded-full bg-primary/50" />
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {user.username} • {user.email}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No users assigned
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-end gap-2">
          <AdminEditAvatarDialog
            avatar={avatar}
            users={users}
            associatedUsers={associatedUsers}
            currentUserId={currentUser.id}
          />
          <DeleteAvatarAlertDialog avatarId={avatar.id} />
        </div>
      </CardContent>
    </Card>
  );
}
