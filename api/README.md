# APIs

`Path: https://domain/api`

## /signature

- type: POST
- request payload:

```json
{
  "creator": "<creator's account address>"
}
```

- response payload

```json
{
  "signature": "<signature>"
}
```

## /tokens

- type: POST
- request payload:

```json
{
  "tokenIds": [1, 2]
}
```

- response payload

```json
[
  {
    "id": 1,
    "creator": "0x96eD022D9bd064A1c7941aee41E03f970EB291Ab",
    "description": "volcano",
    "total_amount": 5
  },
  {
    "id": 2,
    "creator": "0x28Ba9BCD3388cD567672e649ee26Ebd3B4a8223a",
    "description": "river",
    "total_amount": 15
  }
]
```
