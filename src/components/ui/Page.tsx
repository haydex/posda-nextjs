import type { HTMLAttributes, ReactNode } from "react";
import classNames from "@/lib/classNames";

type PageShellSize = "3xl" | "5xl" | "6xl";

type PageShellProps = HTMLAttributes<HTMLElement> & {
  size?: PageShellSize;
};

type PageTitleProps = {
  children: ReactNode;
  className?: string;
};

type PageSubtitleProps = {
  children: ReactNode;
  className?: string;
};

const shellSizeClasses: Record<PageShellSize, string> = {
  "3xl": "page-shell-3xl",
  "5xl": "page-shell-5xl",
  "6xl": "page-shell-6xl",
};

export function PageShell({
  size = "5xl",
  className,
  ...props
}: PageShellProps) {
  return (
    <main
      {...props}
      className={classNames("page-shell", shellSizeClasses[size], className)}
    />
  );
}

export function PageHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={classNames("page-header", className)} />;
}

export function PageTitle({ className, children }: PageTitleProps) {
  return <h1 className={classNames("page-title", className)}>{children}</h1>;
}

export function PageSubtitle({ className, children }: PageSubtitleProps) {
  return <p className={classNames("page-subtitle", className)}>{children}</p>;
}
