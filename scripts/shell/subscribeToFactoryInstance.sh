curl -X POST http://172.232.157.194:3030/entry \
     -H "Authorization: Bearer <jwt_token>" \
     -H "Content-Type: application/json" \
     -d '{"contract_id": "CDSUTAZNBTBAMG2SVZ63FRIBIJOEBSRVVR4GZ3TDXX25AHUN5N3ZYMYU", "max_single_size": 64000, "durability":"instance", "key_xdr":"AAAAFA=="}'
