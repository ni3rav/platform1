import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const tryCatch = async <T>(
  fn: () => T,
  errorHandler?: (error: unknown) => string
): Promise<[error: null, data: T] | [error: string, data: null]> => {
  try {
    const data = await fn();
    return [null, data];
  } catch (error) {
    const message = errorHandler
      ? errorHandler(error)
      : error instanceof Error
        ? error.message
        : "Unknown error";
    return [message, null];
  }
};

export const tryCatchSync = <T>(
  fn: () => T,
  errorHandler?: (error: unknown) => string
): [error: null, data: T] | [error: string, data: null] => {
  try {
    const data = fn();
    return [null, data];
  } catch (error) {
    const message = errorHandler
      ? errorHandler(error)
      : error instanceof Error
        ? error.message
        : "Unknown error";
    return [message, null];
  }
};
