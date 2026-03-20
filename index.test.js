import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import parseJson from './parse-json.js';
import parseUpdates from './parse-updates.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('parseJson throws on invalid JSON', () => {
  expect(() => parseJson('Invalid JSON')).toThrow('The passed JSON is invalid');
});

test('parseJson returns a copy of the Object', () => {
  const testObject = { id: 1, name: "Person" };
  const result = parseJson(JSON.stringify(testObject));
  expect(result.id).toBe(1);
  expect(result.name).toBe('Person');
});

test('parseUpdates throws if non-strings are passed as keys', () => {
  const json = JSON.stringify([['validKey', 1], [1, 2]]);
  expect(() => parseUpdates(json)).toThrow('Keys must all be strings');
});

test('process runs', () => {
  const json = { id: 1 };
  const updates = [['name', 'John Doe']];
  process.env['INPUT_JSON'] = JSON.stringify(json);
  process.env['INPUT_UPDATES'] = JSON.stringify(updates);

  const ip = join(__dirname, 'index.js');
  const result = execSync(`node ${ip}`, { env: process.env }).toString();
  console.log(result);
});
