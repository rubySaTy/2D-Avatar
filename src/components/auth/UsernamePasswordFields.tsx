import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function UsernamePasswordFields() {
  return (
    <>
      <Label htmlFor="username">Username</Label>
      <Input id="username" name="username" placeholder="Username" required />
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        name="password"
        type="password"
        placeholder="Password"
        required
      />
    </>
  );
}
