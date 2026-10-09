import { publicClient } from "@/api/client";

export async function getHealthLiveness() {
    const {data} = await publicClient.get("/api/health") 
    return data 
}