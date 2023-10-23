# Mercury Sandbox
This repo shows how to make a subscription using Axios to make post request to the Mercury Service.

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