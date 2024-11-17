import { redirect } from "next/navigation";
import { db } from "@/lib/db/db";
import { avatars, users } from "@/lib/db/schema";
import { getUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserManagement from "@/components/AdminDashboard/UserManagement";
import AvatarManagement from "@/components/AdminDashboard/AvatarManagement";

export default async function AdminPage() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");

  const usersArray = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  const avatarsArray = await db.select().from(avatars);

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Manage users and avatars</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="avatars">Avatars</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UserManagement users={usersArray} />
            </TabsContent>
            <TabsContent value="avatars">
              <AvatarManagement avatars={avatarsArray} users={usersArray} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
