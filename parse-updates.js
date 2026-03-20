import parseJson from './parse-json.js';

/**
 * Parses the passed JSON Values List
 * @param {string} json
 */
export default function parseUpdates(json) {
  /** @type {[string, any][]} */
  const values = parseJson(json);
  const invalidKeys = values.filter((v) => !(typeof v[0] == 'string'));
  if (invalidKeys.some(() => true)) {
    throw new Error('Keys must all be strings');
  }
  return values;
}
