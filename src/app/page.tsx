import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
            Welcome to SmartTherapy
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
            Experience mental health support with AI-powered therapy sessions tailored
            just for you.
          </p>
        </div>
      </div>
    </section>
  );
}
