# JSON fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change,
adapted to what reads the file.

## Large integers as strings

```json
{ "order_id": 9007199254740993, "created_ns": 1731456000123456789 }
```

```json
{ "order_id": "9007199254740993", "created_ns": "1731456000123456789" }
```

JavaScript reads the first form as `9007199254740992`: every integer above 2^53 is rounded to
a neighbour. Changing the type is a contract change, so name the consumers in the finding.

## Money and other exact decimals

```json
{ "amount": 19.99, "currency": "USD" }
```

```json
{ "amount_minor": 1999, "currency": "USD" }
```

An integer count of minor units, or a decimal string, survives every parser; a binary float
does not survive arithmetic.

## The type the reader expects

```json
{ "port": "8080", "debug": "false", "retries": null }
```

```json
{ "port": 8080, "debug": false }
```

`"false"` is a non-empty string and truthy in most languages. Leave an optional key out
unless the reader distinguishes `null` from absent, and say which it does.

## Dates with a zone, durations with a unit

```json
{ "expires": "03/04/2025 10:00", "timeout": 30 }
```

```json
{ "expires": "2025-04-03T10:00:00Z", "timeout_seconds": 30 }
```

## Secrets by reference

```json
{ "database": { "password": "hunter2" } }
```

```json
{ "database": { "password_env": "DATABASE_PASSWORD" } }
```

A secret that reached a commit is compromised: the fix is to rotate it and then remove it,
not only to delete the line (`SECURITY.md`).

## A schema for a hand-edited file

```json
{
  "$schema": "./config.schema.json",
  "port": 8080
}
```

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": { "port": { "type": "integer", "minimum": 1, "maximum": 65535 } },
  "required": ["port"],
  "additionalProperties": false
}
```

`additionalProperties: false` is what turns a misspelled key into an error; without it the
key is accepted and ignored. Check that the reader tolerates a `$schema` key before adding
one.

## Build JSON with a serialiser

```python
# Before: a quote in name ends the string and adds keys
body = '{"name": "%s", "role": "user"}' % name
```

```python
# After
body = json.dumps({"name": name, "role": "user"})
```

## Dependency ranges and sources in `package.json`

```json
{ "dependencies": { "left-pad": "*", "tool": "git+https://example.com/tool.git", "lib": "latest" } }
```

```json
{ "dependencies": { "left-pad": "^1.3.0", "tool": "git+https://example.com/tool.git#4f2a9c1", "lib": "^2.4.1" } }
```

Commit the lock file with the manifest so the reviewed versions are the installed ones.
