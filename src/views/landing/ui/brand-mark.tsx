import { ShieldCheck } from "lucide-react";
import { cx } from "./classes";

export function BrandMark() {
  return (
    <span className={cx("landing-brand-mark")}  aria-hidden="true"><ShieldCheck /><i /></span>
  );
}
