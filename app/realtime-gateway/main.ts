//This is the main entry point. It will 
// 1. Load and validate public environment variable from springboot 
// 2. Register health endpoints 
// 3. Attach and start the Socket.IO 
// 4. Init the backend instance to communicate with  backend 
// 5. Start the Kafka consumer 
// 6. Start listening for connections 
// 7. Handle shutdown when the app is forced 

import { loadEnv } from "./src/config/env";


/**@abstract
- Cơ chế kết nối giữa gateway và springboot
- Xác thực JWT và public key
- SocketIO
- Các hàm giao tiếp Kafka
 */

const envConfigs = loadEnv()

console.log(envConfigs)