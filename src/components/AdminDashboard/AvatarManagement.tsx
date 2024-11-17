import { Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CreateAvatarForm from "./CreateAvatarForm";
import AvatarCard from "./AvatarCard";
import type { Avatar, UserDto } from "@/lib/db/schema";
import { ScrollArea } from "../ui/scroll-area";

interface AvatarManagementProps {
  avatars: Array<Avatar>;
  users: Array<UserDto>;
}

export default function AvatarManagement({
  avatars,
  users,
}: AvatarManagementProps) {
  return (
    <div>
      <div className="mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Image className="mr-2 h-4 w-4" />
              Create Avatar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] p-0">
            <ScrollArea className="max-h-[90vh] p-6">
              <CreateAvatarForm users={users} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {avatars.map((avatar) => (
          <AvatarCard key={avatar.id} avatar={avatar} />
        ))}
      </div>
    </div>
  );
}
