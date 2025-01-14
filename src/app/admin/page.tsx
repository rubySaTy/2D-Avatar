import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserManagement, TalksDisplay } from "@/components/admin";
import { getTalksWithUserData } from "@/services";
import AvatarManagement from "@/components/avatar/AvatarManagement";

export default async function AdminPage() {
  const { user } = await validateRequest();
  if (!user || user.role !== "admin") redirect("/login");

  const talks = await getTalksWithUserData();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Manage users, avatars, and view talk logs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="avatars">Avatars</TabsTrigger>
              <TabsTrigger value="talks">Talks</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            <TabsContent value="avatars">
              <AvatarManagement />
            </TabsContent>
            <TabsContent value="talks">
              <TalksDisplay talks={talks} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
