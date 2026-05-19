import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PRICE_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: "EGP", label: "جنيه مصري" },
  { value: "SAR", label: "ريال سعودي" },
  { value: "USD", label: "دولار أمريكي" },
  { value: "EUR", label: "يورو" },
  { value: "AED", label: "درهم إماراتي" },
  { value: "KWD", label: "دينار كويتي" },
  { value: "QAR", label: "ريال قطري" },
  { value: "JOD", label: "دينار أردني" },
  { value: "GBP", label: "جنيه إسترليني" },
  { value: "للتفاوض", label: "للتفاوض" },
];

const PRICE_UNIT_LABELS: Record<string, string> = Object.fromEntries(
  PRICE_UNIT_OPTIONS.map(({ value, label }) => [value, label])
);

export function formatPriceUnit(unit: string | null | undefined): string {
  if (!unit) return "";
  return PRICE_UNIT_LABELS[unit] ?? unit;
}
