import type { HTMLAttributes, ReactNode } from "react";
import classNames from "@/lib/classNames";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "li" | "aside";
};

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ as = "div", className, ...props }: CardProps) {
  const Tag = as;
  return <Tag {...props} className={classNames("card", className)} />;
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div {...props} className={classNames("card-header", className)} />;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return <h2 className={classNames("card-title", className)}>{children}</h2>;
}

export function SectionCard({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={classNames("section-card", className)} />
  );
}
