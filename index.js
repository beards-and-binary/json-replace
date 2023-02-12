const core = require('@actions/core');
const parseJson = require('./parse-json');

async function run() {
  try {
    const json = core.getInput('json', { required: true });
    const properties = core.getMultilineInput('properties', { required: true });
    const values = core.getMultilineInput('values', { required: true });
    core.debug(`passed json: ${json}`);
    core.debug(`passed properties: ${properties}`);
    core.debug(`passed values: ${values}`);

    const copy = parseJson(json);
    if (properties.length !== values.length) {
      throw new RangeError('The number of passed properties and values does not match');
    }

    core.info('All inputs are valid.  Performing updates...');
    const joined = properties.map((p, i) => ({ key: p, value: values[i] }));
    joined.forEach((kv) => {
      try {
        const parsedValue = JSON.parse(kv.value);
        core.debug(`Setting property ${kv.key} as ${parsedValue}`);
        copy[kv.key] = parsedValue;
      } catch (error) {
        // If the value can't be parsed, just assign it directly
        core.debug(`Could not parse value, setting property ${kv.key} as ${kv.value}`);
        copy[kv.key] = kv.value;
      }
    });
    core.setOutput('json', copy);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
