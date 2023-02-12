/**
 * Parses the passed JSON and returns the value
 * @param {string} json
 * @returns {Object}
 */
function parseJson(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error('The passed JSON is invalid');
  }
}

module.exports = parseJson;
