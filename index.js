const core = require('@actions/core');
const parseJson = require('./parse-json');
const parseUpdates = require('./parse-updates');

async function run() {
  try {
    const targetJson = core.getInput('json', { required: true });
    const updatesJson = core.getInput('updates', { required: true });

    core.debug(`passed json: ${targetJson}`);
    core.debug(`passed updates: ${updatesJson}`);

    const copy = parseJson(targetJson);
    const updates = parseUpdates(updatesJson);

    core.info(`All inputs are valid.  Performing ${updates.length} update(s)...`);
    updates.forEach(([key, value]) => {
      try {
        const parsedValue = JSON.parse(value);
        core.debug(`Setting property ${key} as ${parsedValue}`);
        copy[key] = parsedValue;
      } catch (error) {
        // If the value can't be parsed, just assign it directly
        core.debug(`Could not parse value, setting property ${key} as ${value}`);
        copy[key] = value;
      }
    });
    core.info('All updates completed successfully');
    core.setOutput('json', copy);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
