// 1st method
// async function deployFunc(hre) {
//     console.log("Hi!")
// }
// module.exports.default = deployFunc

// 2nd
// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
//     // same as hre.getNamedAccounts
//     // hre.deployments
// }

// 3rd
//import the same as
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { getNamedAccounts, deployments, network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    //const { getNamedAccounts, deployments } = hre
    //  hre.getNamedAccounts
    // hre.deployments

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log(network.name)
    let ethUsdPriceFeedAddress // = networkConfig[chainId]["ethUsdPriceFeed"]
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") // get the most recent deployment
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if contract doesn's exist, we deploy a minimal version of
    // for  our local testing

    // when network "hardhat" or "localhost"
    // we want to use mock

    const argsFundMe = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: argsFundMe, // priceFeed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // verify
        await verify(fundMe.address, argsFundMe)
    }
    log("---------------------")
}

module.exports.tags = ["all", "fundme"]
