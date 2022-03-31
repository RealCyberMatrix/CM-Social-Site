import axios, { AxiosInstance } from "axios"

export function createClient(baseURL: string, headers:  Record<string, string | number | boolean>): AxiosInstance { 
    return axios.create( { baseURL: baseURL, headers: headers } ) 
}

