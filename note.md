Tổng quan về luồng sự kiện (timeline) trong quá trình SocketIO chatting realtime. Đầu tiên, bên client sẽ phải phát tín hiệu connection để bên SocketIO có thể thực hiện quá trình handshake. Sau khi handshake thành công, bên client sẽ emit tiếp sự kiện join room. 

CONNECT
│
├─ Socket authentication middleware
│  ├─ JWT invalid             → connect_error
│  ├─ Session revoked         → connect_error
│  └─ Valid                   → connect
│
├─ emit server-join
│  ├─ Not a member            → ACK NOT_A_MEMBER
│  └─ Active member           → join server:{serverId}
│
└─ emit chat-send
   ├─ Not joined              → ACK NOT_A_MEMBER
   ├─ Membership just revoked → Spring returns 404
   └─ Valid                   → persist + ACK + broadcast
