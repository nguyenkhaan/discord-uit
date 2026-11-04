export type GatewayConfig = {
    port: number; 
    springBaseUrl: string
}

function readSpringBaseUrl(): string {
    const value = Bun.env.SPRING_BASE_URL
    
    if (!value?.trim()) {
        throw new Error("SPRING_BASE_URL is required");
    }
    const url = new URL(value)
    if (url.protocol != "http:" && url.protocol !== "https:") {
        throw new Error("Spring base url must use the HTTP or HTTPS")
    }
    return url.toString().replace(/\/+$/, "");
}
function readPort(): number {
    const port = Number(Bun.env.PORT)
    if (!port) throw new Error("Please provide the port number in the invenroment")
    if (!Number.isInteger(port) || port <= 1 || port >= 65535) {
        throw new Error("Port must be between 2 and 65534")
    }
    return port
}

export function loadEnv() : GatewayConfig {
    return {
        port: readPort(), 
        springBaseUrl: readSpringBaseUrl()
    }
}