import { logout } from "@/app/actions";
import { Button } from "./ui/button";

export default function Logout() {
  return (
    <form action={logout}>
      <Button variant={"link"}>Logout</Button>
    </form>
  );
}
