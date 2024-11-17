import { redirect } from "next/navigation";
import { db } from "@/lib/db/db";
import { avatars } from "@/lib/db/schema";
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
import { getUsersDto } from "@/lib/utils.server";

export default async function AdminPage() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");

  const [usersDto, avatarsArray] = await Promise.all([
    getUsersDto(),
    db.select().from(avatars),
  ]);

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
              <UserManagement users={usersDto} />
            </TabsContent>
            <TabsContent value="avatars">
              <AvatarManagement avatars={avatarsArray} users={usersDto} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
