import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import hre from "hardhat";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { before } from 'mocha';
import * as _ from "lodash";

import { ERC1155Following__factory, ERC1155Following } from "../../src/types";
import Following from "../../src/artifacts/contracts/soical/ERC1155Following.sol/ERC1155Following.json";

(async function() {


    let hardhatRuntimeEnv: HardhatRuntimeEnvironment;
    let contract: ERC1155Following;
    let deployer: SignerWithAddress;
    let accounts: SignerWithAddress[];

    describe("ERC1155Following", async() => {

        before(async () => {
            hardhatRuntimeEnv = hre;
            [deployer, ...accounts] = await hardhatRuntimeEnv.ethers.getSigners();
            contract = await new ERC1155Following__factory(deployer).deploy(
                'CyberMatrixFollow', 'CMF', 'a fake prefix' 
            );
        });

        it("should mapping account[1] to follow deployer", async () => {        
            await contract.connect(accounts[1]).follow(deployer.address)
            const follower0 = await contract.listFollowers(deployer.address, BigNumber.from(0), BigNumber.from(10));
            expect(follower0[0] === accounts[1].address);
        });

        it("should mapping account[i] to follow account[j], where j > i", async () => {
            const rst = _.map(
                _.range(1, accounts.length), (n) => { 
                    return _.zipWith(_.fill(Array(n), n), _.range(n), function(a, b){ return [a, b] }) 
                });
            const pairs = _.flatten(rst);
            const queries = _.map(pairs, (item) => {
                return contract.connect(accounts[item[0]]).follow(accounts[item[1]].address) 
            })
            await Promise.all(queries).catch((reject) => console.log(reject))
            
            _.each(_.range(0, accounts.length), async (idx) => {
                const expected = accounts.length - idx;
                const follower = await contract.listFollowers(accounts[idx].address, 0, 20);
                expect(follower.length === expected) 
            });
        });

        it("should list follwer with pagination", async () => {
            const limit = 3
            const firstPage = await contract.listFollowers(accounts[0].address, 0, limit);
            expect(firstPage.length === 3)
            const lastPage = await contract.listFollowers(accounts[0].address, _.floor(accounts.length/limit), limit);
            expect(lastPage.length === 2);
            const outOfRange = await contract.listFollowers(accounts[0].address, _.floor(accounts.length/limit) + 1, limit); 
            expect(outOfRange.length === 0);
            const zeroLimit = await contract.listFollowers(accounts[0].address, 0, 0);
            expect(zeroLimit.length === 0)
            const negativeOffset = await contract.listFollowers(accounts[0].address, -1, limit);
            expect(negativeOffset.length === 0)
        });

        it("shoulde list following accounts via event query", async () => {

            const provider = hardhatRuntimeEnv.ethers.getDefaultProvider();
            const followingRpcStub = new hardhatRuntimeEnv.ethers.Contract(contract.address, Following.abi, provider);
            const filter = followingRpcStub.filters.Following(null, accounts[1].address);
            const query = await contract.queryFilter(filter);
            expect(query.length === accounts.length);
         
        });

    })

})();
