import { publicClient } from '@/api/client';

export async function getHealthLiveness() {
    const { data } = await publicClient.get('/health');
    return data;
}
