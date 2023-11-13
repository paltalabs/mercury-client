# Mercury Sandbox
This repository contains a [Mercury](https://mercurydata.app/) client developed with Node.js and Axios. It demonstrates how to create a subscription by using Axios to send POST requests to the Mercury Service. Additionally, it provides examples for executing GraphQL queries to Mercury's GraphQL endpoint.

A subscription signifies that Mercury will store data selected by the subscriber. Consequently, the retrievable data will only encompass events that occur from the moment the subscription is activated. Therefore, when opting to monitor a specific smart contract, you should either interact with that contract yourself or wait for another party to invoke some operation on it. Data from before the subscription's activation will not be available for review.

## What is Mercury?
[Mercury](https://mercurydata.app/) is an indexer service for Stellar and Soroban. Check more in the [Mercury Docs Page](https://developers.mercurydata.app/)

## Pre-requisites
You need docker installed.
It is tested with: `Docker version 24.0.2, build cb74dfc`

## Get started

1. Set your `.env` file
Copy and update the access token provided by Mercury, refer to [request access](https://developers.mercurydata.app/requesting-access)

```
cp .env.example .env
```
Here, you'll need to paste your access token as well as the address of the Soroban Smart Contract that you want to track, and the endpoint address of the Mercury Server.
```
MERCURY_ACCESS_TOKEN=
CONTRACT_ADDRESS=CBYTTONE7AK2IEPRQUIPAJF6G35KE6HQCA3RFZWKH4HZQGIVQANUMVAN
MERCURY_BACKEND_ENDPOINT=http://ec2-16-170-242-7.eu-north-1.compute.amazonaws.com:3030
MERCURY_GRAPHQL_ENDPOINT=http://ec2-16-170-242-7.eu-north-1.compute.amazonaws.com:5000
```

2. Run a node docker image and install:
Get the `node:18.18.2` container going:
```
bash run.sh
```

Inside the Node Docker containr, install packages:
```
yarn
```

3. Subscribe to ledger entries from contract defined on `.env`
```
node scripts/subscribeToEntries.js
```

4. Run a query asking for ledger entries:
```
node scripts/getAllEntriesForContract.js
```
The retrieved data will be available on `results/responseData.json`

## Subscribe to contract events
Get the container going:
```
bash run.sh
```
Subscribe to events from a contract:
```
node scripts/subscribeToEvent.js
```
The retrieved data will be available on `results/responseData.json`

## check your ledger entries and contract events subscriptions
With your container up and running. Plus, you connected to the shell of the container:

```
node scripts/getEntrySubscriptions.js
node scripts/getEventSubscriptions.js
```

## Choosing contract to subscribe and get data from

You may want to modify the CONTRACT_ADDRESS environment variable on the `.env` file, for this example we are going to use the deployed Factory contract of Soroswap. You are able to find the address of the contract on [this link](https://api.soroswap.finance/api/factory).
```shell
...
CONTRACT_ADDRESS=CDN7QWURHQAVVTM6EEENOGGXTRQIRQR5KQPB7QBEQQVFQLANGSCN6LEZ
...
```
## Update Mercury's access token

prerequisites:
    - Fill `MERCURY_TESTER_EMAIL` and `MERCURY_TESTER_PASSWORD` on your `.env`

Run script:
```bash
node scripts/updateToken.js
```