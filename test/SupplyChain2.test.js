var SupplyChain = artifacts.require('SupplyChain')

    // Test for failing conditions in this contracts
    // test that every modifier is working # Done
    // buyItem

    // test for failure if user does not send enough funds # Done
    // test for purchasing an item that is not for Sale # Done


    // shipItem

    // test for calls that are made by not the seller # Done
    // test for trying to ship an item that is not marked Sold # Done

    // receiveItem

    // test calling the function from an address that is not the buyer # Done
    // test calling the function on an item not marked Shipped # Done

contract('SupplyChain', function(accounts) {

    const owner = accounts[0]
    const seller = accounts[1]
    const buyer = accounts[2]
    const emptyAddress = '0x0000000000000000000000000000000000000000'

    var sku
    const price = web3.toWei(1, "ether")

    it("should add an item with the provided name and price", async() => {
        const supplyChain = await SupplyChain.deployed()

        var eventEmitted = false

        var event = supplyChain.ForSale()
        await event.watch((err, res) => {
            sku = res.args.sku.toString(10)
            eventEmitted = true
        })

        const name = "cable"

        await supplyChain.addItem(name, price, {from: seller})

        const result = await supplyChain.fetchItem.call(sku)

        assert.equal(result[0], name, 'the name of the last added item does match the expected value')
        assert.equal(result[2].toString(10), price, 'the price of the last added item doesS match the expected value')
        assert.equal(result[3].toString(10), 0, 'the state of the item should be "For Sale", which should be declared first in the State Enum')
        assert.equal(result[4], seller, 'the address adding the item should be listed as the seller')
        assert.equal(result[5], emptyAddress, 'the buyer address should be set to 0 when an item is added')
        assert.equal(eventEmitted, true, 'adding an item should emit a For Sale event')
    })

    it("should not allow someone to purchase an item with low price", async() => {
        
        const supplyChain = await SupplyChain.deployed()
        const amount = web3.toWei(0.5, "ether")

        let error = null;

        try{
            await supplyChain.buyItem(sku, {from: buyer, value: amount})
        }
        catch(err){
            error = err
        }

        assert.ok(error instanceof Error )
    })

    it("should not allow seller to ship an item without Sold State", async() => {

        const supplyChain = await SupplyChain.deployed()
        const amount = web3.toWei(3, "ether")

        let error = null;

        try{
            await supplyChain.shipItem(sku, {from: seller})
        }
        catch(err){
            error = err
        }

        assert.ok(error instanceof Error )
    })

    it("should allow someone to purchase an item", async() => {
        const supplyChain = await SupplyChain.deployed()

        var eventEmitted = false

        var event = supplyChain.Sold()
        await event.watch((err, res) => {
            sku = res.args.sku.toString(10)
            eventEmitted = true
        })

        const amount = web3.toWei(2, "ether")

        var sellerBalanceBefore = await web3.eth.getBalance(seller).toNumber()
        var buyerBalanceBefore = await web3.eth.getBalance(buyer).toNumber()

        await supplyChain.buyItem(sku, {from: buyer, value: amount})

        var sellerBalanceAfter = await web3.eth.getBalance(seller).toNumber()
        var buyerBalanceAfter = await web3.eth.getBalance(buyer).toNumber()

        const result = await supplyChain.fetchItem.call(sku)

        assert.equal(result[3].toString(10), 1, 'the state of the item should be "Sold", which should be declared second in the State Enum')
        assert.equal(result[5], buyer, 'the buyer address should be set buyer when he purchases an item')
        assert.equal(eventEmitted, true, 'adding an item should emit a Sold event')
        assert.equal(sellerBalanceAfter, sellerBalanceBefore + parseInt(price, 10), "seller's balance should be increased by the price of the item")
        assert.isBelow(buyerBalanceAfter, buyerBalanceBefore - price, "buyer's balance should be reduced by more than the price of the item (including gas costs)")
    })

    it("should not allow someone to purchase an item with Sold State", async() => {

        const supplyChain = await SupplyChain.deployed()
        const amount = web3.toWei(3, "ether")

        let error = null;

        try{
            await supplyChain.buyItem(sku, {from: buyer, value: amount})
        }
        catch(err){
            error = err
        }

        assert.ok(error instanceof Error )
    })

    it("should not allow someone other than seller to ship an item with Sold State ", async() => {

        const supplyChain = await SupplyChain.deployed()
        const amount = web3.toWei(3, "ether")

        let error = null;

        try{
            await supplyChain.shipItem(sku, {from: buyer})
        }
        catch(err){
            error = err
        }

        assert.ok(error instanceof Error )
    })

    it("should not allow buyer to mark an item as received without Shipped State", async() => {

        const supplyChain = await SupplyChain.deployed()
        const amount = web3.toWei(3, "ether")

        let error = null;

        try{
            await supplyChain.receiveItem(sku, {from: buyer})
        }
        catch(err){
            error = err
        }

        assert.ok(error instanceof Error )
    })

    it("should allow the seller to mark the item as shipped", async() => {
        const supplyChain = await SupplyChain.deployed()

        var eventEmitted = false

        var event = supplyChain.Shipped()
        await event.watch((err, res) => {
            sku = res.args.sku.toString(10)
            eventEmitted = true
        })

        await supplyChain.shipItem(sku, {from: seller})

        const result = await supplyChain.fetchItem.call(sku)

        assert.equal(eventEmitted, true, 'adding an item should emit a Shipped event')
        assert.equal(result[3].toString(10), 2, 'the state of the item should be "Shipped", which should be declared third in the State Enum')
    })

    it("should not allow someone other than buyer to mark an item as received with Shipped State", async() => {

        const supplyChain = await SupplyChain.deployed()
        const amount = web3.toWei(3, "ether")

        let error = null;

        try{
            await supplyChain.receiveItem(sku, {from: seller})
        }
        catch(err){
            error = err
        }

        assert.ok(error instanceof Error )
    })

    it("should allow the buyer to mark the item as received", async() => {
        const supplyChain = await SupplyChain.deployed()

        var eventEmitted = false

        var event = supplyChain.Received()
        await event.watch((err, res) => {
            sku = res.args.sku.toString(10)
            eventEmitted = true
        })

        await supplyChain.receiveItem(sku, {from: buyer})

        const result = await supplyChain.fetchItem.call(sku)

        assert.equal(eventEmitted, true, 'adding an item should emit a Shipped event')
        assert.equal(result[3].toString(10), 3, 'the state of the item should be "Received", which should be declared fourth in the State Enum')
    })

});