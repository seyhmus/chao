// lib/utils.ts
type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassObject
  | ClassArray;
type ClassObject = { [key: string]: boolean | undefined | null };
type ClassArray = ClassValue[];

export function cn(...args: ClassValue[]): string {
  const classes = new Set<string>();

  function process(arg: ClassValue): void {
    if (!arg) return;

    if (typeof arg === "string" || typeof arg === "number") {
      classes.add(String(arg));
      return;
    }

    if (Array.isArray(arg)) {
      arg.forEach(process);
      return;
    }

    if (typeof arg === "object") {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classes.add(key);
      }
    }
  }

  args.forEach(process);
  return Array.from(classes).join(" ");
}
