import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function groupBy<T>(array: T[], keyGetter: (item: T) => string | number) {
  const map: Record<string | number, T[]> = {};
  array.forEach((item) => {
    const key = keyGetter(item);
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(item);
  });
  return map;
}
