import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteAccountCard } from "@/components/profile/DeleteAccountCard";
import { ChangePasswordFormCard } from "@/components/profile/ChangePasswordFormCard";
import { UpdateProfileFormCard } from "@/components/profile/UpdateProfileFormCard";

export default async function ProfilePage() {
  const currentUser = await getUser();
  if (!currentUser) notFound();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-2xl font-bold">{currentUser.username}'s Profile</h1>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security Settings</TabsTrigger>
          </TabsList>

          {/* Profile Information Tab */}
          <TabsContent value="profile">
            <UpdateProfileFormCard user={currentUser} />
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Change Password Card Form */}
              <ChangePasswordFormCard />

              {/* Delete Account Card with Alert Dialog */}
              <DeleteAccountCard userId={currentUser.id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
