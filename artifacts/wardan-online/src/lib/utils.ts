import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PRICE_UNIT_LABELS: Record<string, string> = {
  EGP: "جنيه مصري",
};

export function formatPriceUnit(unit: string | null | undefined): string {
  if (!unit) return "";
  return PRICE_UNIT_LABELS[unit] ?? unit;
}
