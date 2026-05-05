export type ClassValue = string | undefined | null | false;

export default function classNames(...values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}
