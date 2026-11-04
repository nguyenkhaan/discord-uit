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
    private readonly gatewayServiceToken : string 
    constructor(baseUrl : string , gatewayServiceToken : string, timeoutMs: number = DEFAULT_TIMEOUT) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
        this.timeoutMs = timeoutMs
        this.gatewayServiceToken = gatewayServiceToken
    }
    checkInternalHealth(): Promise<BackendClientResponse> {
        return this.get(
            "/internal/realtime/health",
                {
                    //Gui them mot truong X-Gateway-Token de nhan biet xem day co dung that su la request tu gateway cua he thong hay khong
                    "X-Gateway-Token": this.gatewayServiceToken,
                },
            );
    }
    checkHealth():Promise<BackendClientResponse> {
        return this.get("/health");
    }
    //Update the backend client with a function to calling API 
    private async get(path: string, headers: Record<string, string> = {}) :  Promise<BackendClientResponse> {
        try {
            const response = await fetch(
                `${this.baseUrl}${path}`,
                {
                    headers: {
                        accept: "application/json, text/plain",
                        ...headers,
                    },
                    signal: AbortSignal.timeout(this.timeoutMs),
                },
            );
            const content = await response.text() //Convert to the text 
            if (!response.ok)         
                return {
                    healthy: false,
                    reason: "http-error",
                    status: response.status,
                };
            return {
                healthy: true, 
                status: response.status,
                content
            }
        }
        catch (err) {
            return {
                healthy: false,
                reason: "unreachable",
            };
        }
    }
}