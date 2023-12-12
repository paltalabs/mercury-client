curl -X POST http://ec2-16-170-242-7.eu-north-1.compute.amazonaws.com:3030/account \
     -H "Authorization: Bearer $MERCURY_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"publicKey": "GBXRF7BXKPNQIIWAAO6Y6CFIUXX6GCVLILANFPSENPKAFFZA4KOVCLMB"}'
