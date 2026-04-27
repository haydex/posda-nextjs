import { ReactNode } from "react";

export type DynamicSectionField = {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
  valueClassName?: string;
};

type DynamicSectionProps = {
  isLoading: boolean;
  error?: string | null;
  fields?: DynamicSectionField[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function DynamicSection({
  isLoading,
  error,
  fields,
  actions,
  children,
  className,
}: DynamicSectionProps) {
  return (
    <section
      className={
        className ??
        "mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15"
      }
    >
      {isLoading && <p className="text-sm">Loading...</p>}

      {!isLoading && error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!isLoading && !error && fields && fields.length > 0 && (
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className={field.fullWidth ? "col-span-full" : undefined}
            >
              <dt className="font-medium">{field.label}</dt>
              <dd className={field.valueClassName}>{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions && <div className="mt-4 flex flex-wrap gap-3">{actions}</div>}

      {children}
    </section>
  );
}
