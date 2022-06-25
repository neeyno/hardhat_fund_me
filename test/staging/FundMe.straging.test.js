// staging or integration test
const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe, deployer
          const sendValue = ethers.utils.parseEther("0.1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows users to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const afterBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(afterBalance.toString(), "0")
          })
      })
