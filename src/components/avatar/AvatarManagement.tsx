import AvatarCard from "./AvatarCard";
import { getUser } from "@/lib/auth";
import { getAvatarsWithAssociatedUsers, getUsersDto } from "@/services";
import { AdminCreateAvatarDialog } from "./AvatarDialog";
import { CreateClonedVoiceDialog } from "./ClonedVoiceDialog";

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
      <div className="flex space-x-4">
        <AdminCreateAvatarDialog users={users} currentUserId={currentUser.id} />
        <CreateClonedVoiceDialog avatarsWithoutClonedVoice={avatarsWithoutClonedVoice} />
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
