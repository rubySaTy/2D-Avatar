import { redirect } from "next/navigation";
import CreateSession from "@/components/CreateSession";
import { getUser } from "@/lib/auth";
import { getUserAvatars } from "@/services";

export default async function TherapistPage() {
  const user = await getUser();
  if (!user) return redirect("/login");
  const avatars = await getUserAvatars(user.id);

  const sortedAvatars = avatars.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <CreateSession avatars={sortedAvatars} />
    </div>
  );
}
