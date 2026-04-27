"use client";

import { FormEvent, ReactNode } from "react";

type DynamicFormValues = Record<string, unknown>;

export type DynamicFormOption = {
  value: string;
  label?: string;
};

export type DynamicFormField<T extends DynamicFormValues> = {
  key: keyof T & string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox";
  options?: DynamicFormOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  inputMode?:
    | "text"
    | "search"
    | "email"
    | "tel"
    | "url"
    | "none"
    | "numeric"
    | "decimal";
  className?: string;
  controlClassName?: string;
  helperText?: string;
  srOnlyLabel?: boolean;
};

type DynamicFormProps<T extends DynamicFormValues> = {
  values: T;
  fields: Array<DynamicFormField<T>>;
  onChange: (next: T) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
  actions?: ReactNode;
  idPrefix?: string;
};

export default function DynamicForm<T extends DynamicFormValues>({
  values,
  fields,
  onChange,
  onSubmit,
  className,
  actions,
  idPrefix = "form-field",
}: DynamicFormProps<T>) {
  function setValue(key: keyof T & string, nextValue: unknown) {
    onChange({
      ...values,
      [key]: nextValue,
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {fields.map((field) => {
        const id = `${idPrefix}-${field.key}`;
        const rawValue = values[field.key];

        if (field.type === "checkbox") {
          return (
            <label
              key={field.key}
              htmlFor={id}
              className={
                field.className ?? "flex h-10 items-center gap-2 text-sm"
              }
            >
              <input
                id={id}
                type="checkbox"
                checked={Boolean(rawValue)}
                onChange={(event) => setValue(field.key, event.target.checked)}
                disabled={field.disabled}
                required={field.required}
                className={field.controlClassName ?? "h-4 w-4"}
              />
              <span>{field.label}</span>
            </label>
          );
        }

        if (field.type === "select") {
          return (
            <label
              key={field.key}
              htmlFor={id}
              className={field.className ?? "text-sm"}
            >
              <span
                className={
                  field.srOnlyLabel ? "sr-only" : "block text-sm font-medium"
                }
              >
                {field.label}
              </span>
              <select
                id={id}
                value={String(rawValue ?? "")}
                onChange={(event) => setValue(field.key, event.target.value)}
                disabled={field.disabled}
                required={field.required}
                className={
                  field.controlClassName ??
                  "mt-1 h-10 w-full rounded-md border border-black/15 bg-white px-3 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100"
                }
              >
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label ?? option.value}
                  </option>
                ))}
              </select>
              {field.helperText && (
                <p className="mt-1 text-xs text-zinc-500">{field.helperText}</p>
              )}
            </label>
          );
        }

        return (
          <label
            key={field.key}
            htmlFor={id}
            className={field.className ?? "text-sm"}
          >
            <span
              className={
                field.srOnlyLabel ? "sr-only" : "block text-sm font-medium"
              }
            >
              {field.label}
            </span>
            <input
              id={id}
              type={field.type ?? "text"}
              value={String(rawValue ?? "")}
              onChange={(event) => setValue(field.key, event.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              required={field.required}
              inputMode={field.inputMode}
              className={
                field.controlClassName ??
                "mt-1 h-10 w-full rounded-md border border-black/15 bg-transparent px-3 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20"
              }
            />
            {field.helperText && (
              <p className="mt-1 text-xs text-zinc-500">{field.helperText}</p>
            )}
          </label>
        );
      })}

      {actions}
    </form>
  );
}
