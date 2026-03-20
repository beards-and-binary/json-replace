/**
 * Parses the passed JSON and returns the value
 * @param {string} json
 * @returns {Object}
 */
export default function parseJson(json) {
  try {
    return JSON.parse(json);
  } catch {
    throw new Error('The passed JSON is invalid');
  }
}
