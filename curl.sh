curl --request POST \
  --url https://api.circle.com/v1/w3s/compliance/screening/addresses \
  --header 'Content-Type: application/json' \
  --header 'authorization: Bearer <key>' \
  --data '
{
  "idempotencyKey": "6ffdcaa0-2a79-492f-9f38-679dde88ec8c",
  "address": "0x4510DB0928582ca8947A166c2eAFC61331FB76E0",
  "chain": "ETH-SEPOLIA"
}
'