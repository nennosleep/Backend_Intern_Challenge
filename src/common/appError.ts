/**
 * Custom application error with an HTTP status code.
 * Use this instead of casting `new Error(...)` as `any`.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    // Restore prototype chain (required when extending built-in classes in TypeScript)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
