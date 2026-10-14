import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const createClient = () =>
    axios.create({
        baseURL: BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 30000,
        withCredentials: true,
    });

export const publicClient = createClient();
export const privateClient = createClient();
