// unit test
const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
//const { deployments } = require("hardhat-deploy")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe test", async function () {
          let fundMe, deployer, mockV3aggregator
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              // deploy FundMe contract using hardhat-deploy
              // fixture allows to run entire "deploy" folder with any tags
              // const accounts = await ethers.getSigners() // it will return .accounts from hardhat.config.js
              // const acc0 = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("sets the aggregator addresses correctly,", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3aggregator.address)
              })

              it("sets the correct owner,", async function () {
                  const response = await fundMe.getOwner()
                  assert.equal(response, deployer)
              })
          })

          describe("receive and fallback", function () {
              beforeEach(async function () {
                  //const [, acc1] = await ethers.getSigners()
              })
              it("trigers receive function", async function () {
                  const [, acc1] = await ethers.getSigners()
                  //const signerAcc1 = await await fundMe.connect(acc1)

                  const tx = {
                      gasPrice: 20000000000,
                      gasLimit: 1000000,
                      from: acc1.address,
                      to: fundMe.address,
                      value: ethers.utils.parseEther("0.1"),
                      nonce: ethers.provider.getTransactionCount(
                          acc1.address,
                          "latest"
                      ),
                  }
                  //const signedTxResponse = await signerAcc1.signTransaction(tx)
                  const sentTxResponse = await acc1.sendTransaction(tx)
                  await sentTxResponse.wait(1)
                  const contractBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  assert.equal(tx.value.toString(), contractBalance.toString())
              })

              it("trigers fallback function", async function () {
                  const [, acc1] = await ethers.getSigners()
                  const signerAcc1 = await await fundMe.connect(acc1)

                  const tx = {
                      gasPrice: 20000000000,
                      gasLimit: 1000000,
                      from: acc1.address,
                      to: fundMe.address,
                      value: ethers.utils.parseEther("0.1"),
                      nonce: ethers.provider.getTransactionCount(
                          acc1.address,
                          "latest"
                      ),
                      data: ethers.utils.hexlify(
                          ethers.utils.toUtf8Bytes("<MSG>")
                      ),
                  }
                  //const signedTxResponse = await signerAcc1.signTransaction(tx)
                  const sentTxResponse = await acc1.sendTransaction(tx)
                  await sentTxResponse.wait(1)
                  const contractBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  assert.equal(tx.value.toString(), contractBalance.toString())
              })
          })

          describe("fund", function () {
              it("fails if there is not enough eth in tx", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "FundMe__NotEnoughETH()"
                  )
              })

              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAmountFunded(deployer)

                  assert.equal(response.toString(), sendValue.toString())
              })

              it("adds funder to the array", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funderZero = await fundMe.getFunder(0)

                  assert.equal(funderZero, deployer)
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async function () {
                  // arrange
                  const beforeFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const beforeDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // multiply

                  const afterFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const afterDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // assert
                  assert.equal(afterFundBalance, 0)
                  assert.equal(
                      beforeFundBalance.add(beforeDeployerBalance).toString(),
                      afterDeployerBalance.add(gasCost).toString()
                  )
              })

              it("withdraw ETH from a multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  // accounts.map(async (i) => {
                  //     await fundMe.connect(i).fund({ value: sendValue })
                  // })
                  for (let i = 0; i < 5; i++) {
                      const fundConnectedAcc = await fundMe.connect(accounts[i])
                      await fundConnectedAcc.fund({ value: sendValue })
                  }

                  const beforeFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const beforeDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // multiply

                  const afterFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const afterDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Assert
                  assert.equal(afterFundBalance, 0)
                  assert.equal(
                      beforeFundBalance.add(beforeDeployerBalance).toString(),
                      afterDeployerBalance.add(gasCost).toString()
                  )
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (let i = 0; i < 5; i++) {
                      assert.equal(
                          await fundMe.getAmountFunded(accounts[i].address),
                          0
                      )
                  }
              })

              it("only allows the owner to withdraw", async function () {
                  const [, attacker] = await ethers.getSigners()
                  await expect(
                      fundMe.connect(attacker).withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner()")
              })

              // comparing function gas cost

              it("cheaper withdraw single funder", async function () {
                  // arrange
                  const beforeFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const beforeDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // act
                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // multiply

                  const afterFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const afterDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // assert
                  assert.equal(afterFundBalance, 0)
                  assert.equal(
                      beforeFundBalance.add(beforeDeployerBalance).toString(),
                      afterDeployerBalance.add(gasCost).toString()
                  )
              })

              it("cheaper withdraw multi funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  // accounts.map(async (i) => {
                  //     await fundMe.connect(i).fund({ value: sendValue })
                  // })
                  for (let i = 0; i < 5; i++) {
                      const fundConnectedAcc = await fundMe.connect(accounts[i])
                      await fundConnectedAcc.fund({ value: sendValue })
                  }

                  const beforeFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const beforeDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // multiply

                  const afterFundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const afterDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Assert
                  assert.equal(afterFundBalance, 0)
                  assert.equal(
                      beforeFundBalance.add(beforeDeployerBalance).toString(),
                      afterDeployerBalance.add(gasCost).toString()
                  )
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (let i = 0; i < 5; i++) {
                      assert.equal(
                          await fundMe.getAmountFunded(accounts[i].address),
                          0
                      )
                  }
              })
          })
      })
