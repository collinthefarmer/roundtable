/// <reference lib="dom" />

import { ChatMessage } from "../proto";

export class SocketConnection {
    private ws: WebSocket;

    constructor(
        messageHandler: (
            connection: SocketConnection,
            data: ArrayBuffer,
        ) => Promise<void> | void,
    ) {
        const url = window.location.href
            .replace("http://", "ws://")
            .replace("https://", "ws://");

        this.ws = new WebSocket(url);
        this.ws.addEventListener("message", async (ev: MessageEvent<Blob>) => {
            const data = await ev.data.arrayBuffer();
            messageHandler(this, data);
        });
    }

    sendMessage(message: ChatMessage) {
        this.ws.send(ChatMessage.encode(message).finish());
    }
}
