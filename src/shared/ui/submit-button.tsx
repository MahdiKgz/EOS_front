import { LoaderCircle } from "lucide-react";
import { Button } from "./button";
export function SubmitButton({ pending, disabled, children, pendingLabel }: { pending: boolean; disabled?: boolean; children: React.ReactNode; pendingLabel: string }) {
  return <Button type="submit" className="mt-1 h-11 w-full" disabled={pending || disabled} aria-busy={pending}>{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}{pending ? pendingLabel : children}</Button>;
}
