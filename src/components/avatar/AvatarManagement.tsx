import { Image, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AvatarCard from "./AvatarCard";
import { getUser } from "@/lib/auth";
import CreateClonedVoiceForm from "./CreateClonedVoiceForm";
import { AdminCreateAvatarForm } from "./AdminAvatarForm";
import { getAvatarsWithAssociatedUsers, getUsersDto } from "@/services";

export default async function AvatarManagement() {
  const currentUser = await getUser();
  if (!currentUser) return null;

  const [users, avatarsWithUsers] = await Promise.all([
    getUsersDto(),
    getAvatarsWithAssociatedUsers(),
  ]);

  const sortedAvatarsWithUsers = avatarsWithUsers.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateA.getTime() - dateB.getTime();
  });

  const avatarsWithoutClonedVoice = sortedAvatarsWithUsers.filter(
    (avatar) => !avatar.elevenlabsClonedVoiceId
  );
  return (
    <div>
      <div className="mb-4 space-x-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Image className="mr-2 h-4 w-4" /> Create Avatar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] p-0">
            <ScrollArea className="max-h-[90vh] p-6">
              <AdminCreateAvatarForm users={users} currentUserId={currentUser.id} />
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Mic className="mr-2 h-4 w-4" /> Create Cloned Voice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] p-0">
            <ScrollArea className="max-h-[90vh] p-6">
              <CreateClonedVoiceForm avatars={avatarsWithoutClonedVoice} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      {avatarsWithUsers.length === 0 && (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Avatars Display</h1>
          <p>No avatars available to display.</p>
        </div>
      )}
      {avatarsWithUsers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedAvatarsWithUsers.map((avatar) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              users={users}
              associatedUsers={avatar.associatedUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
