import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_BASE_URL 

const createClient = () => axios.create({
    baseURL: BASE_URL, 
    headers: {
        "Content-Type": "application/json"
    }, 
    timeout : 30000
}) 
//interceptor de no tu gan access tooken khi gui di nhe 
export const publicClient = createClient() 
export const privateClient = createClient() 

privateClient.interceptors.request.use(
    (config : InternalAxiosRequestConfig) => { 
        //Luu duoi dang: accessToken va refreshToken
        const accessToken = Cookies.get("accessToken")
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        } 
        return config 
    }
)
publicClient.interceptors.request.use(
    (config : InternalAxiosRequestConfig) => config 
)
//interceptor de co the xu ly loi tap trung 
const handleResponseError = (error : AxiosError) => {
    if (error.response?.status === 401) {
        console.log("Access token khong hop le")
    }
    return Promise.reject(error)
}

publicClient.interceptors.response.use(
    (response) => response,
    handleResponseError
)
privateClient.interceptors.response.use(
    (response) => response,
    handleResponseError
)
