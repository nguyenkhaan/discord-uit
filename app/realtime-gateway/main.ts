//This is the main entry point. It will 
// 1. Load and validate public environment variable from springboot 
// 2. Register health endpoints 
// 3. Attach and start the Socket.IO 
// 4. Init the backend instance to communicate with  backend 
// 5. Start the Kafka consumer 
// 6. Start listening for connections 
// 7. Handle shutdown when the app is forced 

import { BackendClient } from "./src/backend/backend-client";
import { loadEnv } from "./src/config/env";


/**@abstract
- Cơ chế kết nối giữa gateway và springboot
- Xác thực JWT và public key
- SocketIO
- Các hàm giao tiếp Kafka
 */
async function main() 
{
    const envConfigs = loadEnv()
    const backendClient = new BackendClient(envConfigs.springBaseUrl)
    //Checking health
    const health = await backendClient.checkHealth()
    if (!health.healthy) {
         console.error(
            [
                "Spring Boot connection failed",
                `reason=${health.reason}`,
                `status=${health.status ?? "none"}`,
            ].join("; "),
        );
        process.exitCode = 1 //exit the process 
        return 
    }
    console.log("Springboot is health: " , health)
}

await main()