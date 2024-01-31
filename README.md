# csv-api

Mock API tool that reads from a CSV and generates a JSON API at runtime. Custom identifiers allow for querying specific rows, hidden columns, and mock HTTP errors.

## Generated API

| route                          | description                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/csv?url=...`                 | Returns an index based on all rows in the CSV at the `url` param                                                                     |
| `/csv?url=...&{field}={value}` | Returns 1 result where a row has a column `{field}` with value `{value}`. Only works on [unique columns](#identifierunique-columns). |
| `/healthcheck`                 | returns 'ok' if the API is up                                                                                                        |

## Schema

### Reserved Column Names

Reserved column names provide special utility and start with a `$`.

| value   | description                                                | example |
| ------- | ---------------------------------------------------------- | ------- |
| `$http` | override http status, allows for forcing errors on entries | 500     |

### Identifier/Unique Columns

Columns names prefixed with an at-sign (`@`) can be used for lookups.

#### Example

```cs
@deviceId,name
1523,Roku 4K
1524,Apple TV
```

```ts
fetch("/csv?url=...&deviceId=1523"); // results for deviceId #1523
fetch("/csv?url=...&name=Apple%20TV"); // 404
```

### Hidden Columns

Column names starting with a dollar sign (`$`) will never be returned. They are also used for reserved names, but can be used to embed any other data.

### Shallow Columns

Fields by default will show up in the index (`/csv`). If you would like a field to only be available when requesting the individual ID prefix it with an exclamation point (`!`). The prefix is removed when the field is actually returned.

#### Example

```csv
@id,name,!age,$http
1,Alice,28,
2,Bob,26,404
```

When querying the `/csv` route without specifying an `id`, the API returns:

```json
[
  {
    "id": "1",
    "name": "Alice"
  },
  {
    "id": "2",
    "name": "Bob"
  }
]
```

However, if an `id` is specified in the query, for example `/csv?url=???&id=1`, the API returns (note that the `!` is stripped from the final field):

```json
{
  "id": "1",
  "name": "Alice",
  "age": 28
}
```
