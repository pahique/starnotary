const StarNotary = artifacts.require('StarNotary')

contract('StarNotary', accounts => { 
    let defaultAccount = accounts[0];

    let starId1 = 1;
    let starId2 = 2;
    let starId3 = 3;

    beforeEach(async function() { 
        this.contract = await StarNotary.new({from: defaultAccount})
    })
    
    describe('creating a star', () => { 
        let tx;

        beforeEach(async function() {
           tx = await this.contract.createStar('awesome star!', 
                'this is my first star', 
                'ra_032.155', 
                'dec_121.874', 
                'mag_245.978', starId1, {from: defaultAccount})
        })

        it('can create a star and get its info', async function () { 
            
            let result = await this.contract.tokenIdToStarInfo(starId1);

            assert.equal(result[0], 'awesome star!')
            assert.equal(result[1], 'this is my first star')
            assert.equal(result[2], 'ra_032.155')
            assert.equal(result[3], 'dec_121.874')
            assert.equal(result[4], 'mag_245.978')
        })

        it('emits the correct event', async function() {
            assert.equal(tx.logs[0].event, 'Transfer');
            assert.equal(tx.logs[0].args.from, 0);
            assert.equal(tx.logs[0].args.to, defaultAccount);
            assert.equal(tx.logs[0].args.tokenId, starId1);
        })

        it("can't create a star using existing coordinates", async function() {
            await expectThrow(this.contract.createStar('star with existing coordinates!', 
                'I thought this star was new', 
                'ra_032.155', 
                'dec_121.874', 
                'mag_245.978', starId2, {from: defaultAccount}))
        })

        it("can't create a star using existing tokenId", async function() {
            await expectThrow(this.contract.createStar('star with existing tokenId!', 
                'I thought this star was new', 
                'ra_532.155', 
                'dec_521.877', 
                'mag_545.978', starId1, {from: defaultAccount}))
        })

        it('check if star exists', async function() {
            assert.equal(await this.contract.checkIfStarExist(starId1), true);
        })

        it('confirm that star does not exist', async function() {
            assert.equal(await this.contract.checkIfStarExist(starId2), false);
        })

        it('check if coordinates are unique', async function() {
            assert.equal(await this.contract.checkIfUnique('ra_032.155', 'dec_121.874', 'mag_245.978'), false);
            assert.equal(await this.contract.checkIfUnique('ra_032.156', 'dec_121.874', 'mag_245.978'), true);
            assert.equal(await this.contract.checkIfUnique('ra_032.155', 'dec_121.875', 'mag_245.978'), true);
            assert.equal(await this.contract.checkIfUnique('ra_032.155', 'dec_121.874', 'mag_245.979'), true);
            assert.equal(await this.contract.checkIfUnique('ra_032.156', 'dec_121.875', 'mag_245.979'), true);
        })

        it('check if all required parameters are received', async function() {
            await expectThrow(this.contract.createStar('', '', 'ra_1', 'dec_2', 'mag_3', {from: defaultAccount}));
            await expectThrow(this.contract.createStar('name', '', '', 'dec_2', 'mag_3', {from: defaultAccount}));
            await expectThrow(this.contract.createStar('name', '', 'ra_1', '', 'mag_3', {from: defaultAccount}));
            await expectThrow(this.contract.createStar('name', '', 'ra_1', 'dec_2', '', {from: defaultAccount}));
        })
    })

    describe('buying and selling stars', () => { 
        let user1 = accounts[1]
        let user2 = accounts[2]
        let randomMaliciousUser = accounts[3]
        
        let starPrice = web3.toWei(.01, "ether")

        beforeEach(async function () { 
            await this.contract.createStar('awesome star!', 'this is my first star', "ra_032.155", "dec_121.874", "mag_245.978", starId1, {from: user1})    
        })

        it('user1 can put up their star for sale', async function () { 
            assert.equal(await this.contract.ownerOf(starId1), user1)
            await this.contract.putStarUpForSale(starId1, starPrice, {from: user1})
            
            assert.equal(await this.contract.starsForSale(starId1), starPrice)
        })

        it('user2 cannot put a star up for sale if he is not the owner', async function() {
            assert.equal(await this.contract.ownerOf(starId1), user1)
            await expectThrow(this.contract.putStarUpForSale(starId1, starPrice, {from: user2}))
        })

        describe('user2 can buy a star that was put up for sale', () => { 
            beforeEach(async function () { 
                await this.contract.putStarUpForSale(starId1, starPrice, {from: user1})
            })

            it('user2 is the owner of the star after they buy it', async function() { 
                await this.contract.buyStar(starId1, {from: user2, value: starPrice, gasPrice: 0})
                assert.equal(await this.contract.ownerOf(starId1), user2)
            })

            it('user2 ether balance changed correctly', async function () { 
                let overpaidAmount = web3.toWei(.05, 'ether')
                const balanceBeforeTransaction = web3.eth.getBalance(user2)
                await this.contract.buyStar(starId1, {from: user2, value: overpaidAmount, gasPrice: 0})
                const balanceAfterTransaction = web3.eth.getBalance(user2)

                assert.equal(balanceBeforeTransaction.sub(balanceAfterTransaction), starPrice)
            })
        })

        it('malicious user cannot buy a star without sending enough ether', async function() {
            let lowAmount = web3.toWei(.005, 'ether')
            await this.contract.putStarUpForSale(starId1, starPrice, {from: user1})
            await expectThrow(this.contract.buyStar(starId1, {from: randomMaliciousUser, value: lowAmount, gasPrice: 0}))
        })

        it('malicious user cannot buy a star that was not put up on sale', async function() {
            await expectThrow(this.contract.buyStar(starId1, {from: randomMaliciousUser, value: starPrice, gasPrice: 0}))
        })

        describe('allStarsForSale list is up to date', () => {
            beforeEach(async function () { 
                await this.contract.createStar('next awesome star!', 'this is my second star', "ra_132.155", "dec_221.874", "mag_345.978", starId2, {from: user1})    
                await this.contract.createStar('ultimate awesome star!', 'this is my third star', "ra_232.155", "dec_321.874", "mag_445.978", starId3, {from: user1})    
                await this.contract.putStarUpForSale(starId2, starPrice, {from: user1})
            })

            it('after putting up stars on sale', async function() {
                let result = await this.contract.allStarsForSale();
                assert.equal(result.length, 1);
                assert.equal(result[0], starId2);

                await this.contract.putStarUpForSale(starId3, starPrice, {from: user1})
                result = await this.contract.allStarsForSale();
                assert.equal(result.length, 2);
                assert.equal(result[0], starId2);
                assert.equal(result[1], starId3);
            })

            it('after someone buys stars', async function() {
                await this.contract.putStarUpForSale(starId3, starPrice, {from: user1})
                await this.contract.buyStar(starId2, {from: user2, value: starPrice, gasPrice: 0})
                let result = await this.contract.allStarsForSale();
                assert.equal(result.length, 1);
                assert.equal(result[0], starId3);

                await this.contract.buyStar(starId3, {from: user2, value: starPrice, gasPrice: 0})
                result = await this.contract.allStarsForSale();
                assert.equal(result.length, 0);
            })
        })
    })
})

let expectThrow = async function(promise) {
    try {
        await promise;
    } catch(error) {
        assert.exists(error);
        return;
    }
    assert.fail("Expected an error but didn't see one");
}

