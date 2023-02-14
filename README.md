# JSON Value Replacer

This action updates the passed JSON using the passed updates list.

The Updates List should contain sub-lists with a string key and any valid JSON value. (string, number, object, etc.)

## Inputs

### `json`
**Required** The JSON to update

### `updates`
**Required** The list of Updates to process, provided as key / value pairs

Example: `[['key1', 'value 1'], ['key2', {id: 1}]]`

## Outputs
### `json`
The updated JSON

## Example Usage
```yaml
- name: Update Json
  id: update-json
  uses: beards-and-binary/json-replace@v1.0
  with:
    json: '{"foo": "bar"}'
    updates: '[
      ["foo2", "bar2"]
    ]'
    
# Expected Output
#  {
#    "foo": "bar",
#    "foo2": "bar2"
#  }
```
