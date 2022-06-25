require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const ALCHEMY_RINKEBY_URL =
    process.env.ALCHEMY_RINKEBY_URL || "https://eth-rinkeby/example..."
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x141..."
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "other key"
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "other key"

module.exports = {
    //solidity: "0.8.8",
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: ALCHEMY_RINKEBY_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4, // rinkeby chainId is 4
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            // accounts come from hardhat node
            chainId: 31337,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.8",
            },
            {
                version: "0.6.6",
            },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        //coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
    },
}
