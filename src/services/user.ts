import { createClient } from './http'


const client = createClient("http://localhost:5000", { "content-type": "appliction/json" })

export interface User {
    id?: number,
    address: string,
    bio: string,
    avatar: string,
    links: [string, string]
}

const list = (page: number, size: number = 10) => { return client.get<User[]>("users", { params: { _page: page, limit: size } }) }

const findByAddress = (address: string) => { return client.get<User>('users', { params: { address: address } }) }

const findById = (id: number) => { return client.get<User>(`users/{id}`) }

const add = (data: User) => { return client.post<User>('users', data) }

export const UserService = { list, findByAddress, findById, add }
