import { Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CreateAvatarForm from "./CreateAvatarForm";
import AvatarCard from "./AvatarCard";
import { getUser } from "@/lib/auth";
import { usersToAvatars, type Avatar, type UserDto } from "@/lib/db/schema";
import { db } from "@/lib/db/db";

interface AvatarManagementProps {
  avatars: Array<Avatar>;
  users: Array<UserDto>;
}

export default async function AvatarManagement({
  avatars,
  users,
}: AvatarManagementProps) {
  const currentUser = await getUser();
  if (!currentUser) return null;

  const usersToAvatarsArray = await db.select().from(usersToAvatars);

  return (
    <div>
      <div className="mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Image className="mr-2 h-4 w-4" /> Create Avatar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] p-0">
            <ScrollArea className="max-h-[90vh] p-6">
              <CreateAvatarForm users={users} currentUserId={currentUser.id} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {avatars.map((avatar) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            users={users}
            usersToAvatars={usersToAvatarsArray}
          />
        ))}
      </div>
    </div>
  );
}
