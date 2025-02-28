/*
  Util class tests.

  TODO:
  - Finish integration tests for isTokenUtxo() and decodeOpReturn().
  - Mock calls made by isTokenUtxo() and decodeOpReturn() to turn them into unit tests.
*/

const assert = require("assert")
const assert2 = require("chai").assert
const slp = require("./../lib/SLP")
const SLP = new slp()
const nock = require("nock") // http call mocking
const sinon = require("sinon")
const axios = require("axios")

// Mock data used for unit tests
const mockData = require("./fixtures/mock-utils")

// Default to unit tests unless some other value for TEST is passed.
if (!process.env.TEST) process.env.TEST = "unit"
const SERVER = "https://rest.bitcoin.com"

// Used for debugging and iterrogating JS objects.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

describe("#Utils", () => {
  let sandbox

  beforeEach(() => {
    // Activate nock if it's inactive.
    if (!nock.isActive()) nock.activate()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    // Clean up HTTP mocks.
    nock.cleanAll() // clear interceptor list.
    nock.restore()

    sandbox.restore()
  })

  describe("#list", () => {
    it(`should list all SLP tokens`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        nock(SERVER)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockList)
      }

      const list = await SLP.Utils.list()
      //console.log(`list: ${JSON.stringify(list, null, 2)}`)

      assert2.isArray(list)
      assert2.hasAllKeys(list[0], [
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "decimals",
        "documentHash",
        "documentUri",
        "id",
        "initialTokenQty",
        "mintingBatonStatus",
        "name",
        "symbol",
        "timestamp",
        "timestampUnix",
        "totalBurned",
        "totalMinted",
        "txnsSinceGenesis",
        "validAddresses",
        "versionType"
      ])
    })

    it(`should list single SLP token by id: 4276533bb702e7f8c9afd8aa61ebf016e95011dc3d54e55faa847ac1dd461e84`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        nock(SERVER)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockToken)
      }

      const tokenId =
        "4276533bb702e7f8c9afd8aa61ebf016e95011dc3d54e55faa847ac1dd461e84"

      const list = await SLP.Utils.list(tokenId)
      //console.log(`list: ${JSON.stringify(list, null, 2)}`)

      assert2.hasAllKeys(list, [
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "decimals",
        "documentHash",
        "documentUri",
        "id",
        "initialTokenQty",
        "mintingBatonStatus",
        "name",
        "symbol",
        "timestamp",
        "timestampUnix",
        "totalBurned",
        "totalMinted",
        "txnsSinceGenesis",
        "validAddresses",
        "versionType"
      ])
      assert.equal(list.id, tokenId)
    })

    it(`should list multople SLP tokens by array of ids`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        nock(SERVER)
          .post(uri => uri.includes("/"))
          .reply(200, mockData.mockTokens)
      }

      const tokenIds = [
        "4276533bb702e7f8c9afd8aa61ebf016e95011dc3d54e55faa847ac1dd461e84",
        "b3f4f132dc3b9c8c96316346993a8d54d729715147b7b11aa6c8cd909e955313"
      ]

      const list = await SLP.Utils.list(tokenIds)
      // console.log(`list: ${JSON.stringify(list, null, 2)}`)

      assert2.hasAllKeys(list[0], [
        "blockCreated",
        "blockLastActiveMint",
        "blockLastActiveSend",
        "circulatingSupply",
        "containsBaton",
        "decimals",
        "documentHash",
        "documentUri",
        "id",
        "initialTokenQty",
        "mintingBatonStatus",
        "name",
        "symbol",
        "timestamp",
        "timestampUnix",
        "totalBurned",
        "totalMinted",
        "txnsSinceGenesis",
        "validAddresses",
        "versionType"
      ])
      assert.equal(list[0].id, tokenIds[0])
    })
  })

  describe("#balancesForAddress", () => {
    it(`should throw an error if input is not a string or array of strings`, async () => {
      try {
        const address = 1234

        await SLP.Utils.balancesForAddress(address)

        assert2.equal(true, false, "Uh oh. Code path should not end here.")
      } catch (err) {
        //console.log(`Error: `, err)
        assert2.include(
          err.message,
          `Input address must be a string or array of strings`
        )
      }
    })

    it(`should fetch all balances for address: simpleledger:qzv3zz2trz0xgp6a96lu4m6vp2nkwag0kvyucjzqt9`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        sandbox
          .stub(axios, "get")
          .resolves({ data: mockData.balancesForAddress })
      }

      const balances = await SLP.Utils.balancesForAddress(
        "simpleledger:qzv3zz2trz0xgp6a96lu4m6vp2nkwag0kvyucjzqt9"
      )
      // console.log(`balances: ${JSON.stringify(balances, null, 2)}`)

      assert2.isArray(balances)
      assert2.hasAllKeys(balances[0], [
        "tokenId",
        "balanceString",
        "balance",
        "decimalCount",
        "slpAddress"
      ])
    })

    it(`should fetch balances for multiple addresses.`, async () => {
      const addresses = [
        "simpleledger:qzv3zz2trz0xgp6a96lu4m6vp2nkwag0kvyucjzqt9",
        "simpleledger:qqss4zp80hn6szsa4jg2s9fupe7g5tcg5ucdyl3r57"
      ]

      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        sandbox
          .stub(axios, "get")
          .resolves({ data: mockData.balancesForAddresses })
      }

      const balances = await SLP.Utils.balancesForAddress(addresses)
      //console.log(`balances: ${JSON.stringify(balances, null, 2)}`)

      assert2.isArray(balances)
      assert2.isArray(balances[0])
      assert2.hasAllKeys(balances[0][0], [
        "tokenId",
        "balanceString",
        "balance",
        "decimalCount",
        "slpAddress"
      ])
    })
  })

  describe("#balance", () => {
    it(`should fetch balance of single token for address: simpleledger:qzv3zz2trz0xgp6a96lu4m6vp2nkwag0kvyucjzqt9`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit")
        sandbox.stub(axios, "get").resolves({ data: mockData.mockBalance })

      const balance = await SLP.Utils.balance(
        "simpleledger:qzv3zz2trz0xgp6a96lu4m6vp2nkwag0kvyucjzqt9",
        "df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb"
      )
      //console.log(`balance: ${JSON.stringify(balance, null, 2)}`)

      assert2.hasAllKeys(balance, [
        "cashAddress",
        "legacyAddress",
        "slpAddress",
        "tokenId",
        "balance",
        "balanceString"
      ])
    })
  })

  describe("#validateTxid", () => {
    it(`should validate slp txid`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        nock(SERVER)
          .post(uri => uri.includes("/"))
          .reply(200, mockData.mockIsValidTxid)
      }

      const isValid = await SLP.Utils.validateTxid(
        "df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb"
      )
      assert.deepEqual(isValid, [
        {
          txid:
            "df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb",
          valid: true
        }
      ])
    })
  })

  describe("#balancesForToken", () => {
    it(`should retrieve token balances for a given tokenId`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        nock(SERVER)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockBalancesForToken)
      }

      const balances = await SLP.Utils.balancesForToken(
        "df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb"
      )
      assert2.hasAnyKeys(balances[0], ["tokenBalance", "slpAddress"])
    })
  })

  describe("#tokenStats", () => {
    it(`should retrieve stats for a given tokenId`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        nock(SERVER)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockTokenStats)
      }

      const tokenStats = await SLP.Utils.tokenStats(
        "df808a41672a0a0ae6475b44f272a107bc9961b90f29dc918d71301f24fe92fb"
      )
      assert2.hasAnyKeys(tokenStats, [
        "circulatingSupply",
        "decimals",
        "documentUri",
        "name",
        "satoshisLockedUp",
        "symbol",
        "tokenId",
        "totalBurned",
        "totalMinted",
        "txnsSinceGenesis",
        "validAddresses",
        "validUtxos"
      ])
    })
  })

  describe("#transactions", () => {
    it(`should retrieve transactions for a given tokenId and address`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        nock(SERVER)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockTransactions)
      }

      const transactions = await SLP.Utils.transactions(
        "495322b37d6b2eae81f045eda612b95870a0c2b6069c58f70cf8ef4e6a9fd43a",
        "simpleledger:qrhvcy5xlegs858fjqf8ssl6a4f7wpstaqnt0wauwu"
      )
      assert2.hasAnyKeys(transactions[0], ["txid", "tokenDetails"])
    })
  })

  describe("#burnTotal", () => {
    it(`should retrieve input, output and burn totals`, async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        nock(SERVER)
          .get(uri => uri.includes("/"))
          .reply(200, mockData.mockBurnTotal)
      }

      const burnTotal = await SLP.Utils.burnTotal(
        "c7078a6c7400518a513a0bde1f4158cf740d08d3b5bfb19aa7b6657e2f4160de"
      )
      //console.log(`burnTotal: ${JSON.stringify(burnTotal, null, 2)}`)

      assert2.hasAnyKeys(burnTotal, [
        "transactionId",
        "inputTotal",
        "outputTotal",
        "burnTotal"
      ])
    })
  })

  describe("#decodeOpReturn", () => {
    it("should throw an error for a non-string input", async () => {
      try {
        const txid = 53423 // Not a string.

        await SLP.Utils.decodeOpReturn(txid)

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        //console.log(`err: ${util.inspect(err)}`)
        assert2.include(err.message, `txid string must be included`)
      }
    })

    it("should throw an error for non-SLP transaction", async () => {
      try {
        // Mock the call to rest.bitcoin.com
        if (process.env.TEST === "unit") {
          sandbox
            .stub(axios, "get")
            .resolves({ data: mockData.nonSLPTxDetailsWithoutOpReturn })
        }

        const txid =
          "3793d4906654f648e659f384c0f40b19c8f10c1e9fb72232a9b8edd61abaa1ec"

        await SLP.Utils.decodeOpReturn(txid)

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        assert2.include(err.message, `Not an OP_RETURN`)
        //console.log(`err: ${util.inspect(err)}`)
      }
    })

    it("should throw an error for non-SLP transaction with OP_RETURN", async () => {
      try {
        // Mock the call to rest.bitcoin.com
        if (process.env.TEST === "unit") {
          sandbox
            .stub(axios, "get")
            .resolves({ data: mockData.nonSLPTxDetailsWithOpReturn })
        }

        const txid =
          "2ff74c48a5d657cf45f699601990bffbbe7a2a516d5480674cbf6c6a4497908f"

        await SLP.Utils.decodeOpReturn(txid)

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        assert2.include(err.message, `Not a SLP OP_RETURN`)
        //console.log(`err: ${util.inspect(err)}`)
      }
    })

    it("should decode a genesis transaction", async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        sandbox
          .stub(axios, "get")
          .resolves({ data: mockData.txDetailsSLPGenesis })
      }

      const txid =
        "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90"

      const data = await SLP.Utils.decodeOpReturn(txid)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert2.hasAnyKeys(data, [
        "tokenType",
        "transactionType",
        "ticker",
        "name",
        "documentUrl",
        "documentHash",
        "decimals",
        "mintBatonVout",
        "initialQty",
        "tokensSentTo",
        "batonHolder"
      ])
    })

    it("should decode a mint transaction", async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit")
        sandbox.stub(axios, "get").resolves({ data: mockData.txDetailsSLPMint })

      const txid =
        "65f21bbfcd545e5eb515e38e861a9dfe2378aaa2c4e458eb9e59e4d40e38f3a4"

      const data = await SLP.Utils.decodeOpReturn(txid)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert2.hasAnyKeys(data, [
        "transactionType",
        "tokenType",
        "tokenId",
        "mintBatonVout",
        "batonStillExists",
        "quantity",
        "tokensSentTo",
        "batonHolder"
      ])
    })

    it("should decode a send transaction", async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit")
        sandbox.stub(axios, "get").resolves({ data: mockData.txDetailsSLPSend })

      const txid =
        "4f922565af664b6fdf0a1ba3924487344be721b3d8815c62cafc8a51e04a8afa"

      const data = await SLP.Utils.decodeOpReturn(txid)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert2.hasAnyKeys(data, [
        "transactionType",
        "tokenType",
        "tokenId",
        "spendData"
      ])
      assert2.isArray(data.spendData)
      assert2.hasAnyKeys(data.spendData[0], ["quantity", "sentTo", "vout"])
    })

    it("should properly decode a Genesis transaction with no minting baton", async () => {
      // Mock the call to the REST API.
      if (process.env.TEST === "unit") {
        sandbox
          .stub(axios, "get")
          .resolves({ data: mockData.txDetailsSLPGenesisNoBaton })
      }

      const txid =
        "497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7"

      const data = await SLP.Utils.decodeOpReturn(txid)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert2.include(data.batonHolder, "NEVER_CREATED")
    })

    it("should decode a send transaction with alternate encoding", async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        sandbox
          .stub(axios, "get")
          .resolves({ data: mockData.txDetailsSLPSendAlt })
      }

      const txid =
        "d94357179775425ebc59c93173bd6dc9854095f090a2eb9dcfe9797398bc8eae"

      const data = await SLP.Utils.decodeOpReturn(txid)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert2.hasAnyKeys(data, [
        "transactionType",
        "tokenType",
        "tokenId",
        "spendData"
      ])
      assert2.isArray(data.spendData)
      assert2.hasAnyKeys(data.spendData[0], ["quantity", "sentTo", "vout"])
    })
  })

  describe("#isTokenUtxo", () => {
    it("should throw error if input is not an array.", async () => {
      try {
        await SLP.Utils.isTokenUtxo("test")

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        assert2.include(
          err.message,
          `Input must be an array`,
          "Expected error message."
        )
      }
    })

    it("should throw error if utxo does not have satoshis property.", async () => {
      try {
        const utxos = [
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            vout: 3,
            amount: 0.00002015,
            satoshis: 2015,
            height: 594892,
            confirmations: 5
          },
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            vout: 2,
            amount: 0.00000546,
            height: 594892,
            confirmations: 5
          }
        ]

        await SLP.Utils.isTokenUtxo(utxos)

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        assert2.include(
          err.message,
          `utxo 1 does not have a satoshis property`,
          "Expected error message."
        )
      }
    })

    it("should throw error if utxo does not have txid property.", async () => {
      try {
        const utxos = [
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            vout: 3,
            amount: 0.00002015,
            satoshis: 2015,
            height: 594892,
            confirmations: 5
          },
          {
            vout: 2,
            amount: 0.00000546,
            satoshis: 546,
            height: 594892,
            confirmations: 5
          }
        ]

        await SLP.Utils.isTokenUtxo(utxos)

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        assert2.include(
          err.message,
          `utxo 1 does not have a txid property`,
          "Expected error message."
        )
      }
    })

    // This captures an important corner-case. When an SLP token is created, the
    // change UTXO will contain the same SLP txid, but it is not an SLP UTXO.
    it("should return false for change in an SLP token creation transaction", async () => {
      // Mock the call to rest.bitcoin.com
      if (process.env.TEST === "unit") {
        // Stub the call to validateTxid
        sandbox.stub(SLP.Utils, "validateTxid").resolves([
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            valid: true
          },
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            valid: true
          }
        ])

        // Stub the calls to decodeOpReturn.
        sandbox.stub(SLP.Utils, "decodeOpReturn").resolves({
          tokenType: 1,
          transactionType: "genesis",
          ticker: "SLPSDK",
          name: "SLP SDK example using BITBOX",
          documentUrl: "developer.bitcoin.com",
          documentHash: "",
          decimals: 8,
          mintBatonVout: 2,
          initialQty: 507,
          tokensSentTo:
            "bitcoincash:qpcqs0n5xap26un2828n55gan2ylj7wavvzeuwdx05",
          batonHolder: "bitcoincash:qpcqs0n5xap26un2828n55gan2ylj7wavvzeuwdx05"
        })
      }

      const utxos = [
        {
          txid:
            "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
          vout: 3,
          amount: 0.00002015,
          satoshis: 2015,
          height: 594892,
          confirmations: 5
        },
        {
          txid:
            "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
          vout: 2,
          amount: 0.00000546,
          satoshis: 546,
          height: 594892,
          confirmations: 5
        }
      ]

      const data = await SLP.Utils.isTokenUtxo(utxos)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert.equal(
        data[0],
        false,
        "Change should not be identified as SLP utxo."
      )
      assert.equal(data[1], true, "SLP UTXO correctly identified.")
    })

    it("should return true for a simple SEND SLP token utxo", async () => {
      // Mock the call to the REST API

      if (process.env.TEST === "unit") {
        // Stub the call to validateTxid
        sandbox.stub(SLP.Utils, "validateTxid").resolves([
          {
            txid:
              "fde117b1f176b231e2fa9a6cb022e0f7c31c288221df6bcb05f8b7d040ca87cb",
            valid: true
          }
        ])

        //Stub the calls to decodeOpReturn.
        sandbox.stub(SLP.Utils, "decodeOpReturn").resolves({
          tokenType: 1,
          transactionType: "send",
          tokenId:
            "497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7",
          spendData: [
            {
              quantity: "200000000",
              sentTo: "bitcoincash:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huv3xm2ztf",
              vout: 1
            },
            {
              quantity: "99887500000000",
              sentTo: "bitcoincash:qzv7t2pzn2d0pklnetdjt65crh6fe8vnhuwvhsk2nn",
              vout: 2
            }
          ]
        })
      }

      const utxos = [
        {
          txid:
            "fde117b1f176b231e2fa9a6cb022e0f7c31c288221df6bcb05f8b7d040ca87cb",
          vout: 1,
          amount: 0.00000546,
          satoshis: 546,
          height: 596089,
          confirmations: 748
        }
      ]

      const data = await SLP.Utils.isTokenUtxo(utxos)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert.equal(data[0], true, "Simple send UTXO correctly identified")
    })
  })

  describe("#tokenUtxoDetails", () => {
    it("should throw error if input is not an array.", async () => {
      try {
        await SLP.Utils.tokenUtxoDetails("test")

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        assert2.include(
          err.message,
          `Input must be an array`,
          "Expected error message."
        )
      }
    })

    it("should throw error if utxo does not have satoshis property.", async () => {
      try {
        const utxos = [
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            vout: 3,
            amount: 0.00002015,
            satoshis: 2015,
            height: 594892,
            confirmations: 5
          },
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            vout: 2,
            amount: 0.00000546,
            height: 594892,
            confirmations: 5
          }
        ]

        await SLP.Utils.tokenUtxoDetails(utxos)

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        assert2.include(
          err.message,
          `utxo 1 does not have a satoshis property`,
          "Expected error message."
        )
      }
    })

    it("should throw error if utxo does not have txid property.", async () => {
      try {
        const utxos = [
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            vout: 3,
            amount: 0.00002015,
            satoshis: 2015,
            height: 594892,
            confirmations: 5
          },
          {
            vout: 2,
            amount: 0.00000546,
            satoshis: 546,
            height: 594892,
            confirmations: 5
          }
        ]

        await SLP.Utils.tokenUtxoDetails(utxos)

        assert2.equal(true, false, "Unexpected result.")
      } catch (err) {
        assert2.include(
          err.message,
          `utxo 1 does not have a txid property`,
          "Expected error message."
        )
      }
    })

    // This captures an important corner-case. When an SLP token is created, the
    // change UTXO will contain the same SLP txid, but it is not an SLP UTXO.
    it("should return details on minting baton from genesis transaction", async () => {
      // Mock the call to REST API
      if (process.env.TEST === "unit") {
        // Stub the call to validateTxid
        sandbox.stub(SLP.Utils, "validateTxid").resolves([
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            valid: true
          },
          {
            txid:
              "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
            valid: true
          }
        ])

        // Stub the calls to decodeOpReturn.
        sandbox.stub(SLP.Utils, "decodeOpReturn").resolves({
          tokenType: 1,
          transactionType: "genesis",
          ticker: "SLPSDK",
          name: "SLP SDK example using BITBOX",
          documentUrl: "developer.bitcoin.com",
          documentHash: "",
          decimals: 8,
          mintBatonVout: 2,
          initialQty: 507,
          tokensSentTo:
            "bitcoincash:qpcqs0n5xap26un2828n55gan2ylj7wavvzeuwdx05",
          batonHolder: "bitcoincash:qpcqs0n5xap26un2828n55gan2ylj7wavvzeuwdx05"
        })
      }

      const utxos = [
        {
          txid:
            "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
          vout: 3,
          amount: 0.00002015,
          satoshis: 2015,
          height: 594892,
          confirmations: 5
        },
        {
          txid:
            "bd158c564dd4ef54305b14f44f8e94c44b649f246dab14bcb42fb0d0078b8a90",
          vout: 2,
          amount: 0.00000546,
          satoshis: 546,
          height: 594892,
          confirmations: 5
        }
      ]

      const data = await SLP.Utils.tokenUtxoDetails(utxos)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert2.equal(data[0], false, "Change UTXO marked as false.")
      assert2.hasAnyKeys(data[1], [
        "txid",
        "vout",
        "amount",
        "satoshis",
        "height",
        "confirmations",
        "tokenType",
        "tokenId",
        "tokenTicker",
        "tokenName",
        "tokenDocumentUrl",
        "tokenDocumentHash",
        "decimals"
      ])
    })

    it("should return details for a simple SEND SLP token utxo", async () => {
      // Mock the call to REST API
      if (process.env.TEST === "unit") {
        // Stub the call to validateTxid
        sandbox.stub(SLP.Utils, "validateTxid").resolves([
          {
            txid:
              "fde117b1f176b231e2fa9a6cb022e0f7c31c288221df6bcb05f8b7d040ca87cb",
            valid: true
          }
        ])

        // Stub the calls to decodeOpReturn.
        sandbox
          .stub(SLP.Utils, "decodeOpReturn")
          .onCall(0)
          .resolves({
            tokenType: 1,
            transactionType: "send",
            tokenId:
              "497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7",
            spendData: [
              {
                quantity: "200000000",
                sentTo:
                  "bitcoincash:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huv3xm2ztf",
                vout: 1
              },
              {
                quantity: "99887500000000",
                sentTo:
                  "bitcoincash:qzv7t2pzn2d0pklnetdjt65crh6fe8vnhuwvhsk2nn",
                vout: 2
              }
            ]
          })
          .onCall(1)
          .resolves({
            tokenType: 1,
            transactionType: "genesis",
            ticker: "TOK-CH",
            name: "TokyoCash",
            documentUrl: "",
            documentHash: "",
            decimals: 8,
            mintBatonVout: 0,
            initialQty: 21000000,
            tokensSentTo:
              "bitcoincash:qqtuq6rzdgggt2mc9w20u4thkeaez69pmy6ur897sr",
            batonHolder: "NEVER_CREATED"
          })
      }

      const utxos = [
        {
          txid:
            "fde117b1f176b231e2fa9a6cb022e0f7c31c288221df6bcb05f8b7d040ca87cb",
          vout: 1,
          amount: 0.00000546,
          satoshis: 546,
          height: 596089,
          confirmations: 748
        }
      ]

      const data = await SLP.Utils.tokenUtxoDetails(utxos)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      assert2.hasAnyKeys(data[0], [
        "txid",
        "vout",
        "amount",
        "satoshis",
        "height",
        "confirmations",
        "utxoType",
        "tokenId",
        "tokenTicker",
        "tokenName",
        "tokenDocumentUrl",
        "tokenDocumentHash",
        "decimals",
        "tokenQty"
      ])
    })
  })
})
