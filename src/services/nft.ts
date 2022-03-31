import { createClient } from './http'


const client = createClient("http://localhost:5000", { "Content-type": "appliction/json" })

const list = { "name": "xyz" }
const listByAddress = { "name": "abc" }

export const NFTService = { list, listByAddress }
