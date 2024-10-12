import CreateUser from "@/components/CreateUser";
import CreateAvatar from "@/components/CreateAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db/db";
import { userTable } from "@/lib/db/schema";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const usersArray = await db.select().from(userTable);
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <div className="flex items-center justify-center min-h-screen p-4 max-w-md mx-auto">
      <Tabs defaultValue="accounts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">
          <CreateUser />
        </TabsContent>
        <TabsContent value="avatars">
          <CreateAvatar users={usersArray} currentUser={user.username} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
