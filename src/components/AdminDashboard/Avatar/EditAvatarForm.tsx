import { editAvatar } from "@/app/actions/admin";
import BaseAvatarForm from "./BaseAvatarForm";
// import elevenlabs from "@/lib/elevenlabs";
import { getUser } from "@/lib/auth";
import type { Avatar, UserDto } from "@/lib/db/schema";

interface EditAvatarFormProps {
  avatar: Avatar;
  users: Array<UserDto>;
  associatedUsers: Array<UserDto>;
}

export default async function EditAvatarForm({
  avatar,
  users,
  associatedUsers,
}: EditAvatarFormProps) {
  const currentUser = await getUser();
  if (!currentUser) return null;

  TODO: "Edit ElevenLabs voice";
  // if (avatar.elevenlabsVoiceId) {
  //   const voice = await elevenlabs.voices.edit(avatar.elevenlabsVoiceId, {
  //     name: "test",
  //   });
  // }

  return (
    <BaseAvatarForm
      serverAction={editAvatar}
      currentUserId={currentUser.id}
      users={users}
      associatedUsers={associatedUsers}
      initialData={avatar}
      title="Edit Avatar"
      description="Update avatar details."
      submitText="Update Avatar"
      isEditing={true}
    />
  );
}