export interface DbError {
  code: string;
  constraint: string;
  [key: string]: any;
}

/**
 * Type guard to determine if an error is a DbError
 * @param error - The error to check
 * @returns boolean indicating if the error is a DbError
 */
export function isDbError(error: unknown): error is DbError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "constraint" in error &&
    typeof (error as any).code === "string" &&
    typeof (error as any).constraint === "string"
  );
}
