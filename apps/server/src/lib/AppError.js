export class AppError extends Error {
  /**
   * @param {number} statusCode HTTP status sent to the client
   * @param {string} code machine-readable error code, e.g. 'NOT_FOUND'
   * @param {string} message human-readable message safe to expose
   */
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
