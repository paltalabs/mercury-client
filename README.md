# Mercury Sandbox
This repository contains a Mercury client developed with Node.js and Axios. It demonstrates how to create a subscription by using Axios to send POST requests to the Mercury Service. Additionally, it provides examples for executing GraphQL queries to Mercury's GraphQL endpoint.

## Pre-requisites
You need docker installed.
It is tested with: `Docker version 24.0.2, build cb74dfc`

## Get started

Copy and update the access token provided by Mercury, refer to [request access](https://developers.mercurydata.app/requesting-access)

```
cp .env.example .env
```

Get the container going:
```
bash run.sh
```

Install packages:
```
yarn
```

Subscribe to ledger entries from contract defined on `.env`
```
node subscribe.js
```

Run a query asking for ledger entries:
```
node runQuery.js
```

## Choosing contract to subscribe and get data from

You may want to modify the CONTRACT_ADDRESS environment variable on the `.env` file:
```shell
...
CONTRACT_ADDRESS=CBYTTONE7AK2IEPRQUIPAJF6G35KE6HQCA3RFZWKH4HZQGIVQANUMVAN
...
```