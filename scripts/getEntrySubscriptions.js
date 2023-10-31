const { runQuery } = require("./runQuery")

query = `
query MyQuery {
  allLedgerEntrySubscriptions {
    edges {
      node {
        id
        contractId
        keyXdr
        maxSingleSize
        startAt
        userId
      }
    }
  }
}
`

variables = {

}

runQuery(query, variables)