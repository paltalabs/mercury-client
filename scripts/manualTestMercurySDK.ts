import { Mercury } from "mercury-sdk";

console.log("Mercury", Mercury)
// create 


async function main() {
    // console.log("env", process.env)

    if (process.env.MERCURY_BACKEND_ENDPOINT == undefined ||
        process.env.MERCURY_GRAPHQL_ENDPOINT == undefined ||
        process.env.MERCURY_TESTER_EMAIL == undefined ||
        process.env.MERCURY_TESTER_PASSWORD == undefined) {
        console.error("Environment variables are empty")
        return
    }
    console.log("creating instance")
    const mercuryInstance = new Mercury({
        backendEndpoint: process.env.MERCURY_BACKEND_ENDPOINT,
        graphqlEndpoint: process.env.MERCURY_GRAPHQL_ENDPOINT,
        email: process.env.MERCURY_TESTER_EMAIL,
        password: process.env.MERCURY_TESTER_PASSWORD
    })
    const publicKey = 'GCHR5WWPDFF3U3HP2NA6TI6FCQPYEWS3UOPIPJKZLAAFM57CEG4ZYBWP';
    console.log("getting sent payments")

    console.log(".........sentPayments.........")
    const sentPayments = await mercuryInstance.getSentPayments({
        publicKey
    })
    console.log(JSON.stringify(sentPayments))
    
    console.log(".........receivedPayments.........")
    const receivedPayments = await mercuryInstance.getReceivedPayments({
        publicKey
    })
    console.log(JSON.stringify(receivedPayments))

    console.log(".........pathPaymentsStrictSend.........")
    const pathPaymentsStrictSend = await mercuryInstance.getPathPaymentsStrictSend({
        publicKey
    })
    console.log(JSON.stringify(pathPaymentsStrictSend))
    
    console.log(".........pathPaymentsStrictReceive.........")
    const pathPaymentsStrictReceive = await mercuryInstance.getPathPaymentsStrictReceive({
        publicKey
    })
    console.log(JSON.stringify(pathPaymentsStrictReceive))

    console.log(".........liquidityPoolDeposit.........")
    const liquidityPoolDeposit = await mercuryInstance.getLiquidityPoolDeposit({
        publicKey
    })
    console.log(JSON.stringify(liquidityPoolDeposit))
    console.log(".........liquidityPoolWithdraw.........")
    const liquidityPoolWithdraw = await mercuryInstance.getLiquidityPoolWithdraw({
        publicKey
    })
    console.log(JSON.stringify(liquidityPoolWithdraw))

}
main()