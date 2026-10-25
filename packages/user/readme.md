# User Package

The package is required for authorizing user requests.

Create and upload files `users_development.json` and `users_production.json` before use.

Example:

```json
[
  {
    "id": "user_id_1",
    "name": "User name",
    "roles": ["admin", "trusted"]
  },
  {
    "id": "user_id_2",
    "name": "User name 2",
    "roles": ["trusted"]
  }
]
```
