import { WebSocketHandler } from "bun";

import { User } from "./user.ts";

export const websocket: WebSocketHandler<User> = {
    open(ws) {
        ws.data.join(ws);
    },
    message(ws, data) {
        ws.data.push(new Uint8Array(Buffer.from(data)));
    },
    close(ws, code, reason) {
        ws.data.exit(code, reason);
    },
    // drain(ws: SessionConnection): void | Promise<void> {},
};
