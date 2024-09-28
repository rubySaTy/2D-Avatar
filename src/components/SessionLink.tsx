import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyIcon } from "lucide-react";

interface SessionLinkProps {
  clientUrl: string;
}
export default function SessionLink({ clientUrl }: SessionLinkProps) {
  return (
    <div className="flex items-center space-x-2">
      <Input readOnly value={clientUrl} className="flex-grow" />
      <Button
        onClick={() => navigator.clipboard.writeText(clientUrl)}
        className="whitespace-nowrap"
      >
        <CopyIcon className="mr-2 h-4 w-4" /> Copy Link
      </Button>
    </div>
  );
}
