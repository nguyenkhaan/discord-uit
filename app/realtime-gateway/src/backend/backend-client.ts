const DEFAULT_TIMEOUT = 2500
export type BackendClientResponse = {
    healthy: true, 
    status: number,
    content: string 
} | {   
    healthy: false, 
    reason: string, 
    status?: number
}
//We will initialize this instance in the main entry point 
export class BackendClient {
    private readonly baseUrl : string
    private readonly timeoutMs : number
    constructor(baseUrl : string , timeoutMs: number = DEFAULT_TIMEOUT) {
        this.baseUrl = baseUrl
        this.timeoutMs = timeoutMs
    }
    async checkHealth() : Promise<BackendClientResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/health` , {
                headers: {
                    accept: "text/plain"
                }, 
                signal: AbortSignal.timeout(this.timeoutMs),
            }) 
            const result = await response.text() //Vi ben kia no tra text, bruh... Cloudian Love Cloud 
            if (!response.ok) {
                return {
                    healthy: false, status: response.status, reason: 'http-error'
                }
            }
            return {
                healthy: true, 
                status: response.status, 
                content: result 
            }
        } 
        catch (err) {
            return {
                healthy: false, 
                reason: 'unreachable'
            }
        }
    }
}