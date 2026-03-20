import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import parseJson from './parse-json.js';
import parseUpdates from './parse-updates.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// -- parseJson ---------------------------------------------------------

describe('parseJson', () => {
  test('throws on invalid JSON', () => {
    expect(() => parseJson('Invalid JSON')).toThrow('The passed JSON is invalid');
  });

  test('throws on empty string', () => {
    expect(() => parseJson('')).toThrow('The passed JSON is invalid');
  });

  test('parses a flat object', () => {
    const result = parseJson('{"id":1,"name":"Person"}');
    expect(result).toEqual({ id: 1, name: 'Person' });
  });

  test('parses an empty object', () => {
    expect(parseJson('{}')).toEqual({});
  });

  test('parses nested objects', () => {
    const input = JSON.stringify({ a: { b: { c: 1 } } });
    expect(parseJson(input)).toEqual({ a: { b: { c: 1 } } });
  });

  test('parses arrays', () => {
    expect(parseJson('[1,2,3]')).toEqual([1, 2, 3]);
  });

  test('parses null values', () => {
    const result = parseJson('{"key":null}');
    expect(result).toEqual({ key: null });
  });
});

// -- parseUpdates ------------------------------------------------------

describe('parseUpdates', () => {
  test('throws on invalid JSON', () => {
    expect(() => parseUpdates('not json')).toThrow('The passed JSON is invalid');
  });

  test('throws if non-strings are passed as keys', () => {
    const json = JSON.stringify([['validKey', 1], [1, 2]]);
    expect(() => parseUpdates(json)).toThrow('Keys must all be strings');
  });

  test('throws if a key is null', () => {
    const json = JSON.stringify([[null, 'value']]);
    expect(() => parseUpdates(json)).toThrow('Keys must all be strings');
  });

  test('parses valid updates', () => {
    const updates = [['name', 'Alice'], ['age', '30']];
    const result = parseUpdates(JSON.stringify(updates));
    expect(result).toEqual(updates);
  });

  test('accepts an empty updates array', () => {
    expect(parseUpdates('[]')).toEqual([]);
  });

  test('accepts a single update', () => {
    const updates = [['key', 'value']];
    expect(parseUpdates(JSON.stringify(updates))).toEqual(updates);
  });
});

// -- integration (end-to-end via node) ---------------------------------

function runAction(json, updates) {
  const ip = join(__dirname, 'index.js');
  const env = {
    ...process.env,
    INPUT_JSON: JSON.stringify(json),
    INPUT_UPDATES: JSON.stringify(updates),
  };
  return execFileSync('node', [ip], { env }).toString();
}

describe('action integration', () => {
  test('adds a string property', () => {
    const output = runAction({ id: 1 }, [['name', 'John Doe']]);
    expect(output).toContain('::set-output name=json::');
    expect(output).toContain('"name":"John Doe"');
  });

  test('overwrites an existing property', () => {
    const output = runAction({ id: 1, name: 'old' }, [['name', 'new']]);
    const outputLine = output.split('\n').find(l => l.startsWith('::set-output'));
    expect(outputLine).toContain('"name":"new"');
  });

  test('applies multiple updates', () => {
    const output = runAction({ id: 1 }, [['a', 'x'], ['b', 'y']]);
    expect(output).toContain('Performing 2 update(s)');
    expect(output).toContain('"a":"x"');
    expect(output).toContain('"b":"y"');
  });

  test('parses JSON-encoded values (number)', () => {
    const output = runAction({}, [['count', '42']]);
    expect(output).toContain('"count":42');
  });

  test('parses JSON-encoded values (boolean)', () => {
    const output = runAction({}, [['active', 'true']]);
    expect(output).toContain('"active":true');
  });

  test('parses JSON-encoded values (nested object)', () => {
    const nested = JSON.stringify({ x: 1 });
    const output = runAction({}, [['data', nested]]);
    expect(output).toContain('"data":{"x":1}');
  });

  test('falls back to string for unparseable values', () => {
    const output = runAction({}, [['greeting', 'hello world']]);
    expect(output).toContain('"greeting":"hello world"');
  });

  test('handles empty updates array', () => {
    const output = runAction({ id: 1 }, []);
    expect(output).toContain('Performing 0 update(s)');
    expect(output).toContain('"id":1');
  });
});
