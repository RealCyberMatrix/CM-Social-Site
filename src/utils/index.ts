import { ethers, BigNumber } from 'ethers'
import * as _ from 'lodash'

export function formatPrice(price: BigNumber) { 
    return ethers.utils.formatUnits(price.toString(), 'ether') 
}

export function formatAddress(address: string) { 
    return _.replace(address, address.substring(3, address.length-4), "...") 
}