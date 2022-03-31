# Mock Server

The mock server is using `json-server` providing faked web service for the frontend development.

## Attention

1. There is a `id` property for each type of records, which may or may not exist in the actual web services. It is required by json-server in order to insert records vis POST.

2. The mock server doesn't represent how the actual webservice looks like, it is just for de-coupleing between the development of the frontend and the backend.

3. Don't change the json file while mock server is running, the file changes won't loaded if the server is running.

## Start mock server

```sh
yarn ts-node mock-server/server.ts
```

## How to add record vis POST method

```sh
# don't include id for record insertion!

curl -X POST http://localhost:5000/transcations \
   -H "Content-Type: application/json" \
   -d '{"from": "0x6e36f087f86f8ffbf9f9e387667b3898b3536a6c", "to": "0x6e36f087f86f8ffbf9f9e387667b3898b3536a1c"}'
```
