import type { HTMLAttributes } from "react";
import classNames from "@/lib/classNames";

type SectionProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "div";
};

export default function Section({
  as = "section",
  className,
  ...props
}: SectionProps) {
  const Tag = as;
  return <Tag {...props} className={classNames("section-card", className)} />;
}
