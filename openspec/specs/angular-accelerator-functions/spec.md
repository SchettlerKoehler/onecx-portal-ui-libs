# angular-accelerator-functions Specification

## Purpose
Standalone helper functions exported by `@onecx/angular-accelerator`: a form-group validator and an object flattening function.

## Requirements

### Requirement: At-least-one-field-filled validator
`atLeastOneFieldFilledValidator` (a `ValidatorFn`) SHALL validate a form group so that at least one of its control values is filled.

#### Scenario: All fields empty
- **WHEN** every value of the group is `null`, `undefined` or `''`
- **THEN** it returns `{ allFieldsEmpty: true }`

#### Scenario: A field is filled
- **WHEN** at least one value is a non-empty string, `0`, or `false`
- **THEN** it returns `null`

> Note (code-derived): Only `null`, `undefined` and `''` count as empty; empty arrays/objects count as filled.

### Requirement: Flatten object
`flattenObject(ob)` SHALL return a single-level object in which nested plain objects are replaced by dot-joined keys.

#### Scenario: Nested object
- **WHEN** the input is `{ a: 1, b: { c: 2, d: { e: 3 } } }`
- **THEN** the result is `{ a: 1, 'b.c': 2, 'b.d.e': 3 }`

#### Scenario: Values kept as-is
- **WHEN** a value is a `Date`, an array, `null`, `undefined` or a primitive
- **THEN** it is kept unchanged under its (possibly dotted) key and not traversed

#### Scenario: Inherited properties
- **WHEN** the input has inherited (prototype) enumerable properties
- **THEN** they are ignored

> Note (code-derived): An empty nested object produces no keys. The exported `Result` type models the flattened shape.
