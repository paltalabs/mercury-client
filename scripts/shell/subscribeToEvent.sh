curl -X POST http://ec2-16-170-242-7.eu-north-1.compute.amazonaws.com:3030/event \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic29yb3N3YXAiLCJleHAiOjE3MDA1MDIwNDMsInVzZXJfaWQiOjMsInVzZXJuYW1lIjoic29yb3N3YXBAbWVyY3VyeXRlc3Rlci5hcHAiLCJpYXQiOjE2OTk4OTcyNDIsImF1ZCI6InBvc3RncmFwaGlsZSIsImlzcyI6InBvc3RncmFwaGlsZSJ9.cR9rgDneXEb_Gi4gBU__e26_rQua9tBDs0wbjW4PNQw" \
     -H "Content-Type: application/json" \
     -d '{"contract_id": "CAXROB2BP7SIIEHPD52NQKUXFD7M7OTNYNWGXB47AUYEUAUDC6V4F357", "max_single_size": 200}'
