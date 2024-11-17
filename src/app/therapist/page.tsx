import { redirect } from "next/navigation";
import CreateSession from "@/components/CreateSession";
import { getUser } from "@/lib/auth";
import { getUserAvatars } from "@/lib/utils.server";

export default async function TherapistPage() {
  const user = await getUser();
  if (!user) return redirect("/login");
  const avatars = await getUserAvatars(user.id);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <CreateSession avatars={avatars} />
    </div>
  );
}
