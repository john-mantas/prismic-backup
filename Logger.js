import picocolors from "picocolors";
/**
 * A logging utility that provides formatted console output with timestamps and
 * color-coded severity levels.
 */
export class Logger {
  /**
   * Constructs a formatted message with timestamp and level indicator
   *
   * @private
   * @param {string} level - The severity level indicator
   * @param {string} message - The message to be logged
   * @returns {string} The formatted message with timestamp and level
   */
  #composeMessage(level, message) {
    return `${picocolors.gray(new Date().toISOString())} ${level} ${message}`;
  }

  /**
   * Logs an informational message
   *
   * @param {string} message - The informational message to log
   */
  info(message) {
    console.log(this.#composeMessage(picocolors.blue("[INFO]"), message));
  }

  /**
   * Logs an error message in red
   *
   * @param {string} message - The error message to log
   */
  error(message) {
    console.error(picocolors.red(this.#composeMessage("[ERROR]", message)));
  }

  /**
   * Logs a warning message in yellow
   *
   * @param {string} message - The warning message to log
   */
  warn(message) {
    console.log(picocolors.yellow(this.#composeMessage("[WARN]", message)));
  }
}
