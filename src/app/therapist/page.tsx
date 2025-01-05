import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { getPublicAvatars, getUserAvatars } from "@/services";
import { AvatarDashboard } from "@/components/therapist/TherapistDashboard";

export const dynamic = "force-dynamic";

export default async function TherapistPage() {
  const { user } = await validateRequest();
  if (!user) return redirect("/login");

  const [avatars, publicAvatars] = await Promise.all([
    getUserAvatars(user.id),
    getPublicAvatars(),
  ]);

  const sortedAvatars = avatars.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="container mx-auto p-6">
      <AvatarDashboard
        key={sortedAvatars.length}
        avatars={sortedAvatars}
        publicAvatars={publicAvatars}
      />
    </div>
  );
}
