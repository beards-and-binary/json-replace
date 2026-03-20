import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
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

let tmpDir;
let outputFile;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'json-replace-test-'));
  outputFile = join(tmpDir, 'output');
  writeFileSync(outputFile, '');
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function runAction(json, updates) {
  const ip = join(__dirname, 'index.js');
  const env = {
    ...process.env,
    INPUT_JSON: JSON.stringify(json),
    INPUT_UPDATES: JSON.stringify(updates),
    GITHUB_OUTPUT: outputFile,
  };
  const stdout = execFileSync('node', [ip], { env }).toString();
  const output = readFileSync(outputFile, 'utf8');
  return { stdout, output };
}

function getOutputJson(output) {
  // GITHUB_OUTPUT format: name<<delimiter\nvalue\ndelimiter\n
  const match = output.match(/json<<(.*)\n([\s\S]*?)\n\1/);
  return match ? match[2] : null;
}

describe('action integration', () => {
  test('adds a string property', () => {
    const { stdout, output } = runAction({ id: 1 }, [['name', 'John Doe']]);
    expect(stdout).toContain('Performing 1 update(s)');
    const json = getOutputJson(output);
    expect(JSON.parse(json)).toEqual({ id: 1, name: 'John Doe' });
  });

  test('overwrites an existing property', () => {
    const { output } = runAction({ id: 1, name: 'old' }, [['name', 'new']]);
    const json = getOutputJson(output);
    expect(JSON.parse(json)).toEqual({ id: 1, name: 'new' });
  });

  test('applies multiple updates', () => {
    const { stdout, output } = runAction({ id: 1 }, [['a', 'x'], ['b', 'y']]);
    expect(stdout).toContain('Performing 2 update(s)');
    const json = getOutputJson(output);
    const result = JSON.parse(json);
    expect(result.a).toBe('x');
    expect(result.b).toBe('y');
  });

  test('parses JSON-encoded values (number)', () => {
    const { output } = runAction({}, [['count', '42']]);
    const result = JSON.parse(getOutputJson(output));
    expect(result.count).toBe(42);
  });

  test('parses JSON-encoded values (boolean)', () => {
    const { output } = runAction({}, [['active', 'true']]);
    const result = JSON.parse(getOutputJson(output));
    expect(result.active).toBe(true);
  });

  test('parses JSON-encoded values (nested object)', () => {
    const nested = JSON.stringify({ x: 1 });
    const { output } = runAction({}, [['data', nested]]);
    const result = JSON.parse(getOutputJson(output));
    expect(result.data).toEqual({ x: 1 });
  });

  test('falls back to string for unparseable values', () => {
    const { output } = runAction({}, [['greeting', 'hello world']]);
    const result = JSON.parse(getOutputJson(output));
    expect(result.greeting).toBe('hello world');
  });

  test('handles empty updates array', () => {
    const { stdout, output } = runAction({ id: 1 }, []);
    expect(stdout).toContain('Performing 0 update(s)');
    const result = JSON.parse(getOutputJson(output));
    expect(result).toEqual({ id: 1 });
  });
});
