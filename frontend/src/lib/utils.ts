import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function assertEnv(
  key: string,
  message = `Missing environment variable: ${key}`
): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(message);
  }
  return value;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
