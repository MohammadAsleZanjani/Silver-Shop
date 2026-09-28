const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[٬,]/g, "")
    .trim();
}

export function formatToman(value: string | number): string {
  try {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return String(value);
    }
    return `${new Intl.NumberFormat("fa-IR").format(number)} تومان`;
  } catch {
    return String(value);
  }
}

export function formatGram(value: string | number): string {
  try {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return String(value);
    }
    return `${new Intl.NumberFormat("fa-IR", {
      maximumFractionDigits: 8,
    }).format(number)} گرم`;
  } catch {
    return String(value);
  }
}

export function formatNumber(value: string | number, maximumFractionDigits = 4): string {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return String(value);
  }
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits }).format(number);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}
