curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"contract_id":"CBYTTONE7AK2IEPRQUIPAJF6G35KE6HQCA3RFZWKH4HZQGIVQANUMVAN", "max_single_size": 4000}' -H "Authorization: Bearer $MERCURY_ACCESS_TOKEN" \
  http://ec2-16-170-242-7.eu-north-1.compute.amazonaws.com:3030/entry