import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Welcome to SmartTherapy
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Experience the future of mental health support with AI-powered
              therapy sessions tailored just for you.
            </p>
          </div>
          <div className="space-x-4">
            <Button>Get Started</Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </div>
      </section>
    </main>
  );
}